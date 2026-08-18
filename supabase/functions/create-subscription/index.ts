import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MP_API = "https://api.mercadopago.com";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function money(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function getUserId(req: Request, supabaseUrl: string, serviceKey: string): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth) return null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: auth },
    });
    if (!res.ok) return null;
    const u: any = await res.json();
    return u?.id || null;
  } catch {
    return null;
  }
}

async function rest(supabaseUrl: string, serviceKey: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  return { res, body: res.status === 204 ? null : await res.json().catch(() => null) };
}

async function getPricingConfig(supabaseUrl: string, serviceKey: string) {
  const { body } = await rest(
    supabaseUrl, serviceKey,
    "/rest/v1/site_content?select=key,value&section=eq.suscripcion"
  );
  const m: Record<string, string> = {};
  if (Array.isArray(body)) {
    for (const r of body as any[]) m[r.key] = r.value;
  }
  const num = (k: string, d: number) => {
    const n = parseFloat(m[k]);
    return Number.isFinite(n) ? n : d;
  };
  return {
    recurringDiscount: num("recurring_discount", 5),
    tiers: [
      { months: 2, discount: num("prepaid_2m", 6) },
      { months: 3, discount: num("prepaid_3m", 8) },
      { months: 6, discount: num("prepaid_6m", 12) },
      { months: 12, discount: num("prepaid_12m", 15) },
    ],
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

    const token = Deno.env.get("MP_ACCESS_TOKEN");
    if (!token) return json({ ok: false, error: "MP_ACCESS_TOKEN no configurado" }, 500);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userId = await getUserId(req, supabaseUrl, serviceKey);
    if (!userId) return json({ ok: false, error: "Debes iniciar sesión" }, 401);

    let body: any;
    try { body = await req.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }

    const planId = String(body.plan_id || "");
    const mode = body.mode === "recurring" ? "recurring" : "prepaid";
    const durationMonths = Math.max(2, Math.floor(Number(body.duration_months) || 2));
    const backUrl = body.back_url || "";
    const shipping = body.shipping || {};

    if (!planId) return json({ ok: false, error: "Falta plan_id" }, 400);
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.municipality) {
      return json({ ok: false, error: "Faltan datos de envío" }, 400);
    }

    // Plan desde la BD (precios autoritativos)
    const { res: planRes, body: planBody } = await rest(
      supabaseUrl, serviceKey,
      `/rest/v1/subscription_plans?select=id,name,bottle_count,price_per_bottle,shipping_flat,active&id=eq.${planId}`
    );
    const plan = Array.isArray(planBody) ? planBody[0] : null;
    if (!planRes.ok || !plan) return json({ ok: false, error: "Plan no encontrado" }, 404);
    if (plan.active === false) return json({ ok: false, error: "El plan no está disponible" }, 400);

    const perBottle = money(Number(plan.price_per_bottle) || 65);
    const shippingFee = money(Number(plan.shipping_flat) || 150);
    const bottles = Math.max(1, Number(plan.bottle_count) || 6);
    const pricing = await getPricingConfig(supabaseUrl, serviceKey);

    let totalPaid: number;
    let periodDays: number;
    let billingType: string;
    let duration: number;

    if (mode === "recurring") {
      const discBottle = money(perBottle * (1 - pricing.recurringDiscount / 100));
      const monthly = money(bottles * discBottle + shippingFee);
      totalPaid = monthly;
      periodDays = 30;
      billingType = "recurring";
      duration = 1;
    } else {
      const tier = pricing.tiers.find((t) => t.months === durationMonths) || pricing.tiers[0];
      const discBottle = money(perBottle * (1 - tier.discount / 100));
      const monthly = money(bottles * discBottle + shippingFee);
      totalPaid = money(monthly * tier.months);
      periodDays = tier.months * 30;
      billingType = "prepaid";
      duration = tier.months;
    }

    // Recurrente: el primer cargo autoriza y el webhook de pago avanza el periodo
    const currentPeriodEnd = mode === "recurring"
      ? new Date().toISOString()
      : new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

    // Insertar suscripción en estado pendiente (se activa con el pago)
    const { res: subRes, body: subBody } = await rest(
      supabaseUrl, serviceKey,
      "/rest/v1/subscriptions",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          status: "pending",
          payment_status: "pendiente",
          shipping_address: String(shipping.address).slice(0, 300),
          shipping_municipality: String(shipping.municipality).slice(0, 60),
          shipping_phone: String(shipping.phone).slice(0, 20),
          duration_months: duration,
          total_paid: totalPaid,
          billing_type: billingType,
          current_period_end: currentPeriodEnd,
        }),
      }
    );
    const subscription = Array.isArray(subBody) ? subBody[0] : subBody;
    if (!subRes.ok || !subscription?.id) return json({ ok: false, error: "No se pudo crear la suscripción" }, 502);
    const subId = subscription.id;

    if (mode === "recurring") {
      // Preapproval de Mercado Pago: cobro automático mensual
      const mpRes = await fetch(`${MP_API}/preapproval`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: `Suscripción Queens Hidro — ${plan.name}`,
          external_reference: String(subId),
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: totalPaid,
            currency_id: "MXN",
          },
          back_url: backUrl ? `${backUrl}?sub=success` : undefined,
          notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
        }),
      });
      const mpData: any = await mpRes.json();
      if (!mpRes.ok) {
        await rest(supabaseUrl, serviceKey, `/rest/v1/subscriptions?id=eq.${subId}`, { method: "DELETE" });
        return json({ ok: false, error: mpData?.message ?? "No se pudo crear la suscripción" }, 502);
      }
      await rest(supabaseUrl, serviceKey, `/rest/v1/subscriptions?id=eq.${subId}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ mp_preapproval_id: String(mpData.id) }),
      });
      return json({ ok: true, init_point: mpData.init_point, subscription_id: subId, mode });
    }

    // Prepago: preferencia de pago única
    const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        external_reference: `sub_${subId}`,
        items: [
          {
            id: String(plan.id),
            title: `Suscripción Queens Hidro — ${plan.name} (${duration} meses)`,
            quantity: 1,
            unit_price: totalPaid,
            currency_id: "MXN",
          },
        ],
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "bank_transfer" },
            { id: "atm" },
            { id: "digital_currency" },
            { id: "crypto_currency" },
          ],
        },
        back_urls: backUrl
          ? {
              success: `${backUrl}?sub=success`,
              pending: `${backUrl}?sub=pending`,
              failure: `${backUrl}?sub=failure`,
            }
          : undefined,
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      }),
    });
    const mpData: any = await mpRes.json();
    if (!mpRes.ok) {
      await rest(supabaseUrl, serviceKey, `/rest/v1/subscriptions?id=eq.${subId}`, { method: "DELETE" });
      return json({ ok: false, error: mpData?.message ?? "No se pudo crear el pago" }, 502);
    }
    await rest(supabaseUrl, serviceKey, `/rest/v1/subscriptions?id=eq.${subId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ mp_payment_id: String(mpData.id) }),
    });
    return json({ ok: true, init_point: mpData.init_point, subscription_id: subId, mode });
  } catch (e: any) {
    console.error("create-subscription error:", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
