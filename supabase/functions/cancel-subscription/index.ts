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

async function getUserEmail(supabaseUrl: string, serviceKey: string, userId: string): Promise<string> {
  if (!userId) return "";
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

async function getProfileName(supabaseUrl: string, serviceKey: string, userId: string): Promise<string> {
  if (!userId) return "";
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=full_name&id=eq.${userId}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return "";
    const rows: any = await res.json();
    return (Array.isArray(rows) && rows[0]?.full_name) || "";
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

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = Deno.env.get("MP_ACCESS_TOKEN") || "";

    const userId = await getUserId(req, supabaseUrl, serviceKey);
    if (!userId) return json({ ok: false, error: "Debes iniciar sesión" }, 401);

    let body: any;
    try { body = await req.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }
    const subId = String(body.subscription_id || "");
    if (!subId) return json({ ok: false, error: "Falta subscription_id" }, 400);

    const { res: subRes, body: subBody } = await rest(
      supabaseUrl, serviceKey,
      `/rest/v1/subscriptions?select=id,user_id,status,billing_type,mp_preapproval_id,subscription_plans(name)&id=eq.${subId}`
    );
    const sub = Array.isArray(subBody) ? subBody[0] : null;
    if (!subRes.ok || !sub) return json({ ok: false, error: "Suscripción no encontrada" }, 404);

    const { res: profRes, body: profBody } = await rest(
      supabaseUrl, serviceKey,
      `/rest/v1/profiles?select=role&id=eq.${userId}`
    );
    const profile = Array.isArray(profBody) ? profBody[0] : null;
    const isAdmin = !!(profile && profile.role === "admin");

    if (sub.user_id !== userId && !isAdmin) {
      return json({ ok: false, error: "No autorizado" }, 403);
    }

    // Cancelar cobro automático en Mercado Pago si es recurrente
    if (sub.billing_type === "recurring" && sub.mp_preapproval_id && token) {
      try {
        await fetch(`${MP_API}/preapproval/${sub.mp_preapproval_id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
      } catch (e) {
        console.error("cancel preapproval error:", e);
      }
    }

    await rest(supabaseUrl, serviceKey, `/rest/v1/subscriptions?id=eq.${subId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "cancelled" }),
    });

    const email = await getUserEmail(supabaseUrl, serviceKey, sub.user_id);
    if (email) {
      const name = await getProfileName(supabaseUrl, serviceKey, sub.user_id);
      await sendEmail(supabaseUrl, serviceKey, {
        to: email,
        template: "subscription_cancelled",
        data: { name, plan_name: sub.subscription_plans?.name || "Queens Hidro" },
      });
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error("cancel-subscription error:", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
