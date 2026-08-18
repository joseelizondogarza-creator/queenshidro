import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MP_API = "https://api.mercadopago.com";
const ORDER_TTL_MS = 60 * 60 * 1000; // la preferencia y la reserva expiran en 1h
const TRANSFER_TTL_MS = 72 * 60 * 60 * 1000; // transferencia: 72h para confirmar
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

async function getUserEmail(supabaseUrl: string, serviceKey: string, userId: string): Promise<string> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return "";
    const u: any = await res.json();
    return u?.email || "";
  } catch {
    return "";
  }
}

async function sendEmail(supabaseUrl: string, serviceKey: string, payload: { to: string; template: string; data: any }) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("send-email error:", e);
  }
}

async function getSettings(supabaseUrl: string, serviceKey: string) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/site_content?select=key,value&section=eq.tienda`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  const rows: any = await res.json();
  const map: Record<string, string> = {};
  (Array.isArray(rows) ? rows : []).forEach((r: any) => { if (r?.key) map[r.key] = r.value; });
  return {
    flat: Math.max(0, parseFloat(map.shipping_flat) || 199),
    subscriberFlat: Math.max(0, parseFloat(map.shipping_flat_subscriber) || 150),
    maxQty: Math.max(1, parseInt(map.max_qty_per_product, 10) || 12),
  };
}

async function getBankInfo(supabaseUrl: string, serviceKey: string) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/site_content?select=key,value&section=eq.pago`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  const rows: any = await res.json();
  const map: Record<string, string> = {};
  (Array.isArray(rows) ? rows : []).forEach((r: any) => { if (r?.key) map[r.key] = r.value; });
  return {
    bank: map.transfer_bank || "",
    holder: map.transfer_holder || "",
    clabe: map.transfer_clabe || "",
    account: map.transfer_account || "",
    instructions: map.transfer_instructions || "",
  };
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

async function hasActiveSubscription(supabaseUrl: string, serviceKey: string, userId: string | null) {
  if (!userId) return false;
  const { res, body } = await rest(
    supabaseUrl, serviceKey,
    `/rest/v1/subscriptions?select=id&user_id=eq.${userId}&status=eq.active&limit=1`
  );
  if (!res.ok) return false;
  const rows = Array.isArray(body) ? body : [];
  return rows.length > 0;
}

async function deleteOrder(supabaseUrl: string, serviceKey: string, orderId: string) {
  await rest(supabaseUrl, serviceKey, `/rest/v1/order_items?order_id=eq.${orderId}`, { method: "DELETE" });
  await rest(supabaseUrl, serviceKey, `/rest/v1/orders?id=eq.${orderId}`, { method: "DELETE" });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let body: any;
    try { body = await req.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }

    const rawItems: any[] = Array.isArray(body.items) ? body.items : [];
    const shipping = body.shipping || {};
    const backUrl = body.back_url;
    const paymentMethod = body.payment_method === "transferencia" ? "transferencia" : "mercadopago";

    if (!rawItems.length) return json({ ok: false, error: "El carrito está vacío" }, 400);
    if (!shipping.name || !shipping.phone || !shipping.address) {
      return json({ ok: false, error: "Faltan datos de envío" }, 400);
    }

    const token = Deno.env.get("MP_ACCESS_TOKEN");
    if (paymentMethod === "mercadopago" && !token) {
      return json({ ok: false, error: "MP_ACCESS_TOKEN no configurado" }, 500);
    }
    if (paymentMethod === "mercadopago" && !backUrl) {
      return json({ ok: false, error: "Falta back_url" }, 400);
    }

    // 1. Normalizar items (fusionar duplicados)
    const merged = new Map<string, number>();
    rawItems.forEach((i: any) => {
      const id = String(i?.product_id || "");
      const qty = Math.max(1, Math.floor(Number(i?.quantity) || 1));
      if (id) merged.set(id, (merged.get(id) || 0) + qty);
    });
    if (!merged.size) return json({ ok: false, error: "Carrito inválido" }, 400);

    const settings = await getSettings(supabaseUrl, serviceKey);
    const ids = Array.from(merged.keys());

    // 2. Releer productos en DB (precios vigentes, activos, stock)
    const { res: prodRes, body: prodRows } = await rest(
      supabaseUrl, serviceKey,
      `/rest/v1/products?select=id,name,price,active,stock&id=in.(${ids.join(",")})`
    );
    if (!prodRes.ok) return json({ ok: false, error: "No se pudieron validar los productos" }, 502);
    const products = new Map<string, any>();
    (Array.isArray(prodRows) ? prodRows : []).forEach((p: any) => products.set(String(p.id), p));

    const errors: string[] = [];
    const orderItems: any[] = [];
    for (const [id, qty] of merged) {
      const p = products.get(id);
      if (!p) { errors.push("Uno de los productos ya no está disponible"); continue; }
      if (p.active === false) { errors.push(`${p.name} ya no está disponible`); continue; }
      const clamped = Math.min(qty, settings.maxQty);
      if (p.stock !== null && p.stock !== undefined && clamped > Number(p.stock)) {
        errors.push(`Solo quedan ${p.stock} de ${p.name}`);
        continue;
      }
      orderItems.push({
        product_id: id,
        product_name: String(p.name),
        quantity: clamped,
        unit_price: money(Number(p.price) || 0),
      });
    }
    if (errors.length) {
      return json({ ok: false, error: "stock", details: errors, code: "out_of_stock" }, 200);
    }
    if (!orderItems.length) return json({ ok: false, error: "Carrito inválido" }, 400);

    // 3. Totales server-side
    const subtotal = money(orderItems.reduce((s, i) => s + i.unit_price * i.quantity, 0));
    const userId = await getUserId(req, supabaseUrl, serviceKey);
    const customerEmail = String(shipping.email || "").trim() ||
      (userId ? await getUserEmail(supabaseUrl, serviceKey, userId) : "");
    const subscriber = await hasActiveSubscription(supabaseUrl, serviceKey, userId);
    const shippingFee = money(subscriber ? settings.subscriberFlat : settings.flat);
    const total = money(subtotal + shippingFee);
    const expiresAt = new Date(Date.now() + (paymentMethod === "transferencia" ? TRANSFER_TTL_MS : ORDER_TTL_MS)).toISOString();

    // 4. Insertar orden + items (snapshot de precios)
    const { res: ordRes, body: ord } = await rest(
      supabaseUrl, serviceKey,
      "/rest/v1/orders",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          email: customerEmail || null,
          status: "pendiente",
          payment_status: "pendiente",
          payment_method: paymentMethod,
          total,
          shipping_fee: shippingFee,
          shipping_name: String(shipping.name).slice(0, 120),
          shipping_phone: String(shipping.phone).slice(0, 20),
          shipping_address: String(shipping.address).slice(0, 300),
          notes: String(shipping.notes || "").slice(0, 500),
          expires_at: expiresAt,
        }),
      }
    );
    const order = Array.isArray(ord) ? ord[0] : ord;
    if (!ordRes.ok || !order?.id) return json({ ok: false, error: "No se pudo crear la orden" }, 502);

    const { res: itemsRes } = await rest(
      supabaseUrl, serviceKey,
      "/rest/v1/order_items",
      {
        method: "POST",
        body: JSON.stringify(orderItems.map((i) => ({ order_id: order.id, ...i }))),
      }
    );
    if (!itemsRes.ok) {
      await deleteOrder(supabaseUrl, serviceKey, order.id);
      return json({ ok: false, error: "No se pudo guardar la orden" }, 502);
    }

    // 5. Transferencia bancaria: sin pago en línea, sin reserva de stock.
    //    El admin confirma manualmente al recibir el comprobante.
    if (paymentMethod === "transferencia") {
      const bank = await getBankInfo(supabaseUrl, serviceKey);
      if (customerEmail) {
        await sendEmail(supabaseUrl, serviceKey, {
          to: customerEmail,
          template: "transfer_instructions",
          data: { name: shipping.name, order_id: order.id, total, bank },
        });
      }
      return json({
        ok: true,
        order_id: order.id,
        payment_method: "transferencia",
        total,
        bank,
      });
    }

    // 6. Reservar stock atómicamente (solo Mercado Pago)
    const decremented: string[] = [];
    for (const i of orderItems) {
      const p = products.get(String(i.product_id));
      if (p && p.stock !== null && p.stock !== undefined) {
        const { res: rpcRes, body: rpcBody } = await rest(
          supabaseUrl, serviceKey,
          "/rest/v1/rpc/decrement_stock",
          { method: "POST", body: JSON.stringify({ p_product: i.product_id, qty: i.quantity }) }
        );
        if (!rpcRes.ok || rpcBody !== true) {
          for (const done of decremented) {
            const it = orderItems.find((x) => String(x.product_id) === done);
            if (it) {
              await rest(supabaseUrl, serviceKey, "/rest/v1/rpc/increment_stock", {
                method: "POST",
                body: JSON.stringify({ p_product: done, qty: it.quantity }),
              });
            }
          }
          await deleteOrder(supabaseUrl, serviceKey, order.id);
          return json({ ok: false, error: "stock", code: "out_of_stock", details: [`Sin stock suficiente de ${i.product_name}`] }, 200);
        }
        decremented.push(String(i.product_id));
      }
    }

    // 7. Preferencia de pago MP (solo tarjeta / cuenta MP; sin OXXO ni SPEI)
    const publicBack = /^https:\/\//i.test(backUrl) && !/localhost|127\.0\.0\.1/i.test(backUrl);
    const preference: any = {
      external_reference: String(order.id),
      items: [
        ...orderItems.map((i) => ({
          id: String(i.product_id),
          title: String(i.product_name),
          quantity: i.quantity,
          unit_price: i.unit_price,
          currency_id: "MXN",
        })),
        { id: "envio", title: "Envío", quantity: 1, unit_price: shippingFee, currency_id: "MXN" },
      ],
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" },           // OXXO, 7-Eleven, etc.
          { id: "bank_transfer" },    // SPEI / CLABE
          { id: "atm" },
          { id: "digital_currency" },
          { id: "crypto_currency" },
        ],
      },
      back_urls: {
        success: `${backUrl}?payment=success`,
        pending: `${backUrl}?payment=pending`,
        failure: `${backUrl}?payment=failure`,
      },
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      expires: true,
      expiration_date_from: new Date(Date.now() - 60000).toISOString(),
      expiration_date_to: expiresAt,
    };
    if (publicBack) preference.auto_return = "approved";

    const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(preference),
    });
    const mpData: any = await mpRes.json();
    if (!mpRes.ok) {
      for (const done of decremented) {
        const it = orderItems.find((x) => String(x.product_id) === done);
        if (it) {
          await rest(supabaseUrl, serviceKey, "/rest/v1/rpc/increment_stock", {
            method: "POST",
            body: JSON.stringify({ p_product: done, qty: it.quantity }),
          });
        }
      }
      await deleteOrder(supabaseUrl, serviceKey, order.id);
      return json({ ok: false, error: mpData?.message ?? "No se pudo crear el pago" }, 502);
    }

    await rest(supabaseUrl, serviceKey, `/rest/v1/orders?id=eq.${order.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ mp_preference_id: String(mpData.id) }),
    });

    if (customerEmail) {
      await sendEmail(supabaseUrl, serviceKey, {
        to: customerEmail,
        template: "order_received",
        data: {
          name: shipping.name,
          order_id: order.id,
          items: orderItems,
          subtotal,
          shipping_fee: shippingFee,
          total,
        },
      });
    }

    return json({ ok: true, init_point: mpData.init_point, order_id: order.id, total });
  } catch (e: any) {
    console.error("create-order error:", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
