import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ============================================================
// Queens Hidro — Solicitudes de degustación
// La fecha es tentativa y sólo aplica a visitas locales.
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIME_ZONE = "America/Monterrey";
const LOCAL_MUNICIPALITIES = new Set([
  "Apodaca",
  "Escobedo",
  "Guadalupe",
  "Monterrey",
  "San Nicolás",
  "San Pedro",
  "Santa Catarina",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function clean(value: unknown, max = 160): string {
  return String(value ?? "").trim().slice(0, max);
}

function dateInMexico(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== "literal") values[part.type] = part.value;
  });
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

async function rest(supabaseUrl: string, serviceKey: string, path: string, init: RequestInit = {}) {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function sendEmail(
  supabaseUrl: string,
  serviceKey: string,
  payload: { to: string; template: string; data: Record<string, unknown> },
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error("tasting email error:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "Servicio no configurado" }, 500);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "JSON inválido" }, 400);
  }

  // Hidden honeypot for the public form. Real visitors never fill it.
  if (clean(body.website, 80)) return json({ ok: false, error: "No se pudo enviar la solicitud" }, 400);

  const requestType = clean(body.request_type, 20);
  const desiredDate = clean(body.desired_date, 10);
  const municipality = clean(body.municipality, 80);
  const state = clean(body.state, 80);
  const city = clean(body.city, 80);
  const fullName = clean(body.full_name, 120);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 30);
  const company = clean(body.company, 120);
  const desiredVolume = clean(body.desired_volume, 140);
  const leadType = clean(body.lead_type, 40);
  const notes = clean(body.notes, 1500);

  if (requestType !== "local" && requestType !== "nacional") {
    return json({ ok: false, error: "Tipo de solicitud inválido" }, 400);
  }
  if (requestType === "local" && (!validDate(desiredDate) || desiredDate < addDays(dateInMexico(), 7))) {
    return json({ ok: false, error: "La fecha debe tener al menos 7 días de anticipación" }, 400);
  }
  if (!fullName || !company || !desiredVolume) {
    return json({ ok: false, error: "Faltan datos del negocio" }, 400);
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: "Correo inválido" }, 400);
  }
  if (leadType !== "botella" && leadType !== "barril") {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }
  if (requestType === "local" && !LOCAL_MUNICIPALITIES.has(municipality)) {
    return json({ ok: false, error: "La visita local sólo está disponible en el área metropolitana de Monterrey" }, 400);
  }
  if (requestType === "nacional" && (!state || !city)) {
    return json({ ok: false, error: "Faltan estado y ciudad" }, 400);
  }

  const request = {
    request_type: requestType,
    desired_date: desiredDate || null,
    municipality: requestType === "local" ? municipality : "",
    state: requestType === "local" ? "Nuevo León" : state,
    city: requestType === "local" ? municipality : city,
    full_name: fullName,
    email,
    phone,
    company,
    desired_volume: desiredVolume,
    lead_type: leadType,
    notes,
    status: "nuevo",
  };

  const requestResponse = await rest(supabaseUrl, serviceKey, "tasting_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(request),
  });
  if (!requestResponse.ok) {
    console.error("tasting request insert error:", await requestResponse.text());
    return json({ ok: false, error: "No se pudo guardar la solicitud" }, 502);
  }
  const requestRows = await requestResponse.json().catch(() => []);
  const requestId = Array.isArray(requestRows) ? requestRows[0]?.id : null;

  const location = requestType === "local"
    ? `Visita en ${municipality}, Nuevo León`
    : `Kit nacional · ${city}, ${state}`;
  const leadNotes = [
    `Solicitud de degustación ${requestType === "local" ? "local" : "nacional"}.`,
    desiredDate ? `Fecha tentativa: ${desiredDate}.` : "",
    location + ".",
    `Volumen que le gustaría explorar: ${desiredVolume}.`,
    notes ? `Notas: ${notes}` : "",
  ].filter(Boolean).join("\n");

  const leadResponse = await rest(supabaseUrl, serviceKey, "leads", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      full_name: fullName,
      email,
      phone,
      company,
      source: "degustacion",
      status: "nuevo",
      lead_type: leadType,
      notes: leadNotes,
    }),
  });
  if (!leadResponse.ok) {
    console.error("tasting lead insert error:", await leadResponse.text());
    return json({ ok: false, error: "La solicitud quedó registrada, pero no se pudo crear el lead" }, 502);
  }
  const leadRows = await leadResponse.json().catch(() => []);
  const leadId = Array.isArray(leadRows) ? leadRows[0]?.id : null;
  if (requestId && leadId) {
    const updateResponse = await rest(supabaseUrl, serviceKey, `tasting_requests?id=eq.${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ lead_id: leadId, updated_at: new Date().toISOString() }),
    });
    if (!updateResponse.ok) console.error("tasting request lead link error:", await updateResponse.text());
  }

  const adminEmail = Deno.env.get("ADMIN_EMAIL") || Deno.env.get("FROM_EMAIL") || "hola@queenshidro.com";
  const emailData = {
    request_id: requestId || "",
    request_type: requestType,
    desired_date: desiredDate,
    location,
    municipality,
    state,
    city,
    full_name: fullName,
    email,
    phone,
    company,
    desired_volume: desiredVolume,
    lead_type: leadType,
    notes,
  };

  await sendEmail(supabaseUrl, serviceKey, {
    to: adminEmail,
    template: "tasting_internal",
    data: emailData,
  });
  await sendEmail(supabaseUrl, serviceKey, {
    to: email,
    template: "tasting_confirmation",
    data: { ...emailData, name: fullName },
  });

  return json({ ok: true, request_id: requestId });
});
