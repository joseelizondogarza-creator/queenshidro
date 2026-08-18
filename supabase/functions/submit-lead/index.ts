import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ============================================================
// Queens Hidro — Captura de lead (Distribuye Queens)
// Inserta el lead y envía: notificación interna + autorespuesta.
// ============================================================

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

async function sendEmail(supabaseUrl: string, serviceKey: string, payload: { to: string; template: string; data: any }) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("send-email error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }

  const lead = {
    full_name: String(body.full_name || "").trim().slice(0, 120),
    email: String(body.email || "").trim().slice(0, 120),
    phone: String(body.phone || "").trim().slice(0, 20),
    company: String(body.company || "").trim().slice(0, 120),
    source: String(body.source || "distribuye").slice(0, 40),
    status: "nuevo",
    lead_type: String(body.lead_type || "").slice(0, 40),
    notes: String(body.notes || "").trim().slice(0, 1000),
  };

  if (!lead.full_name) return json({ ok: false, error: "Falta el nombre" }, 400);
  if (!lead.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) {
    return json({ ok: false, error: "Correo inválido" }, 400);
  }

  const insRes = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });
  if (!insRes.ok) return json({ ok: false, error: "No se pudo guardar el lead" }, 502);

  const adminEmail = Deno.env.get("ADMIN_EMAIL") || Deno.env.get("FROM_EMAIL") || "hola@queenshidro.com";

  // Notificación interna (fire-and-forget)
  await sendEmail(supabaseUrl, serviceKey, {
    to: adminEmail,
    template: "lead_internal",
    data: lead,
  });

  // Autorespuesta al prospecto (fire-and-forget)
  await sendEmail(supabaseUrl, serviceKey, {
    to: lead.email,
    template: "lead_autoreply",
    data: { name: lead.full_name },
  });

  return json({ ok: true });
});
