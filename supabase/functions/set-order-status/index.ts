import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ============================================================
// Queens Hidro — Cambio de estado de orden (admin)
// Actualiza el estado y envía correo al cliente en "enviado"/"entregado".
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"];

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userId = await getUserId(req, supabaseUrl, serviceKey);
  if (!userId) return json({ ok: false, error: "Debes iniciar sesión" }, 401);

  // Solo admin
  const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${userId}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const prof: any = await profRes.json().catch(() => null);
  const isAdmin = Array.isArray(prof) && prof[0]?.role === "admin";
  if (!isAdmin) return json({ ok: false, error: "No autorizado" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }

  const orderId = String(body.order_id || "");
  const status = String(body.status || "");
  if (!orderId || !VALID.includes(status)) return json({ ok: false, error: "Parámetros inválidos" }, 400);

  const { res: ordRes, body: ord } = await (async () => {
    const r = await fetch(`${supabaseUrl}/rest/v1/orders?select=id,email,user_id,shipping_name&id=eq.${orderId}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    return { res: r, body: await r.json().catch(() => null) };
  })();
  const order = Array.isArray(ord) ? ord[0] : null;
  if (!ordRes.ok || !order) return json({ ok: false, error: "Orden no encontrada" }, 404);

  const updRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ status }),
  });
  if (!updRes.ok) return json({ ok: false, error: "No se pudo actualizar la orden" }, 502);

  if (status === "enviado" || status === "entregado") {
    const email = order.email || (order.user_id ? await getUserEmail(supabaseUrl, serviceKey, order.user_id) : "");
    if (email) {
      await sendEmail(supabaseUrl, serviceKey, {
        to: email,
        template: "order_shipped",
        data: { name: order.shipping_name, order_id: orderId, status },
      });
    }
  }

  return json({ ok: true });
});
