import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ============================================================
// Queens Hidro — Envío de correos transaccionales (Resend)
// Uso interno: las demás edge functions invocan este endpoint
// con Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>.
// Body: { to, template, data }
// ============================================================

const RESEND_API = "https://api.resend.com/emails";

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

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c;
  });
}

function money(n: unknown): string {
  return "$" + (Number(n) || 0).toFixed(2) + " MXN";
}

function shortId(id: unknown): string {
  return String(id ?? "").slice(0, 8).toUpperCase();
}

// ---------- Layout compartido (estilos inline, dark editorial) ----------
function layout(opts: { kicker: string; title: string; body: string; cta?: { href: string; label: string } }) {
  const cta = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px"><tr><td style="border-radius:2px;background:#d4a845"><a href="${esc(opts.cta.href)}" style="display:inline-block;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#0a0a0c;text-decoration:none">${esc(opts.cta.label)}</a></td></tr></table>`
    : "";
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
  <div style="background:#0a0a0c;color:#e9e7e2;padding:0;width:100%">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#0a0a0c">
      <tr><td style="padding:28px 32px 0;border-top:4px solid #e10357">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.04em;color:#e9e7e2;font-weight:700">QUEENS&nbsp;HIDRO</td>
          <td style="text-align:right;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;color:#d4a845">HIDROMIEL&nbsp;ARTESANAL</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 32px 0">
        <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#9c9aa2">${esc(opts.kicker)}</p>
        <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#e9e7e2;font-weight:500">${opts.title}</h1>
      </td></tr>
      <tr><td style="padding:20px 32px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:2px">
          <tr><td style="padding:24px">
            ${opts.body}
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 32px 24px;text-align:center">
        ${cta}
      </td></tr>
      <tr><td style="padding:20px 32px 32px;border-top:1px solid rgba(255,255,255,0.08)">
        <p style="margin:0;font-size:11px;line-height:1.7;color:#9c9aa2;font-family:Arial,Helvetica,sans-serif">
          Queens Hidro · Hidromiel artesanal · Monterrey, NL<br>
          <a href="https://queenshidro.com" style="color:#d4a845;text-decoration:none">queenshidro.com</a> ·
          <a href="https://instagram.com/queenshidro" style="color:#d4a845;text-decoration:none">@queenshidro</a><br>
          <span style="font-size:10px">Prohibida la venta a menores de 18 años. Consume con responsabilidad.</span>
        </p>
      </td></tr>
    </table>
  </div>
</body>
</html>`;
}

function label(text: string, value: string) {
  return `<tr><td style="padding:6px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9c9aa2">${esc(text)}</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#e9e7e2">${value}</td></tr>`;
}

function itemsTable(items: unknown) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return "";
  const trs = rows
    .map((i: any) => {
      const qty = Math.max(1, Number(i?.quantity) || 1);
      const price = Number(i?.unit_price) || 0;
      return `<tr>
        <td style="padding:8px 0;font-size:13px;color:#e9e7e2;border-bottom:1px solid rgba(255,255,255,0.06)">${esc(i?.name || i?.product_name || "Producto")} <span style="color:#9c9aa2">× ${qty}</span></td>
        <td style="padding:8px 0;text-align:right;font-size:13px;color:#e9e7e2;border-bottom:1px solid rgba(255,255,255,0.06)">${money(price * qty)}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px">${trs}</table>`;
}

// ---------- Plantillas ----------
const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  order_received(data: any) {
    const oid = shortId(data.order_id);
    return {
      subject: `Recibimos tu pedido #${oid}`,
      html: layout({
        kicker: "Pedido recibido",
        title: `Gracias, ${esc(data.name)}.`,
        body: `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">Recibimos tu pedido <strong>#${oid}</strong>. En cuanto confirmemos tu pago te avisamos para coordinar la entrega.</p>${itemsTable(data.items)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.12)">
            <tr><td style="padding:10px 0;font-size:11px;color:#9c9aa2">Subtotal</td><td style="padding:10px 0;text-align:right;font-size:13px;color:#e9e7e2">${money(data.subtotal)}</td></tr>
            <tr><td style="padding:10px 0;font-size:11px;color:#9c9aa2">Envío</td><td style="padding:10px 0;text-align:right;font-size:13px;color:#e9e7e2">${money(data.shipping_fee)}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#e9e7e2;font-weight:700">Total</td><td style="padding:10px 0;text-align:right;font-size:15px;color:#d4a845;font-weight:700">${money(data.total)}</td></tr>
          </table>`,
      }),
    };
  },

  transfer_instructions(data: any) {
    const oid = shortId(data.order_id);
    const b = data.bank || {};
    const body = `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">Tu pedido <strong>#${oid}</strong> quedó registrado con pago por <strong>transferencia bancaria</strong>. Realiza el depósito por el total exacto para que lo confirmemos.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
        ${label("Total a transferir", `<strong style="color:#d4a845">${money(data.total)}</strong>`)}
        ${b.bank ? label("Banco", esc(b.bank)) : ""}
        ${b.holder ? label("Titular", esc(b.holder)) : ""}
        ${b.clabe ? label("CLABE", `<span style="font-family:'Courier New',monospace;letter-spacing:0.05em">${esc(b.clabe)}</span>`) : ""}
        ${b.account ? label("Cuenta", esc(b.account)) : ""}
      </table>
      ${b.instructions ? `<p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:#9c9aa2">${esc(b.instructions)}</p>` : ""}
      <p style="margin:10px 0 0;font-size:12px;line-height:1.7;color:#9c9aa2">Envía tu comprobante por Instagram <strong style="color:#e9e7e2">@queenshidro</strong> o WhatsApp y confirmamos tu pedido.</p>`;
    return {
      subject: `Completa tu transferencia — pedido #${oid}`,
      html: layout({ kicker: "Pago por transferencia", title: `Hola, ${esc(data.name)}.`, body }),
    };
  },

  payment_confirmed(data: any) {
    const oid = shortId(data.order_id);
    return {
      subject: `Pago confirmado — pedido #${oid}`,
      html: layout({
        kicker: "Pago confirmado",
        title: "¡Tu pago fue confirmado!",
        body: `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">Recibimos tu pago por <strong>${money(data.total)}</strong>. Tu pedido <strong>#${oid}</strong> está en preparación y te contactaremos para coordinar la entrega.</p>${itemsTable(data.items)}`,
      }),
    };
  },

  order_shipped(data: any) {
    const oid = shortId(data.order_id);
    const entregado = data.status === "entregado";
    return {
      subject: entregado ? `Tu pedido #${oid} fue entregado` : `Tu pedido #${oid} va en camino`,
      html: layout({
        kicker: entregado ? "Entrega completada" : "En camino",
        title: entregado ? "Tu pedido fue entregado." : "Tu pedido va en camino.",
        body: `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">${
          entregado
            ? `Tu pedido <strong>#${oid}</strong> fue entregado. ¡Disfrútalo y consume con responsabilidad!`
            : `Tu pedido <strong>#${oid}</strong> ya salió a reparto. Pronto lo tendrás en la puerta de tu casa.`
        }</p><p style="margin:14px 0 0;font-size:12px;color:#9c9aa2">Si tienes dudas, escríbenos a <a href="mailto:hola@queenshidro.com" style="color:#d4a845">hola@queenshidro.com</a>.</p>`,
      }),
    };
  },

  subscription_active(data: any) {
    const recurrente = data.billing_type === "recurring";
    const importe = recurrente
      ? `${money(data.amount)} / mes`
      : `${money(data.amount)} (${esc(data.duration_months || "")} meses)`;
    return {
      subject: "Tu suscripción Queens Hidro está activa",
      html: layout({
        kicker: "Suscripción activa",
        title: "¡Bienvenida a la tribu!",
        body: `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">Tu suscripción <strong>${esc(data.plan_name)}</strong> quedó activada.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">
            ${label("Plan", esc(data.plan_name))}
            ${label("Modalidad", recurrente ? "Mensual · renovable" : "Prepago")}
            ${label("Cargo", `<strong style="color:#d4a845">${importe}</strong>`)}
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#9c9aa2">Con tu membresía, tus pedidos de la tienda pagan envío preferencial de suscriptor.</p>`,
        cta: { href: "https://queenshidro.com/cuenta.html", label: "Ver mi cuenta" },
      }),
    };
  },

  subscription_cancelled(data: any) {
    return {
      subject: "Suscripción cancelada",
      html: layout({
        kicker: "Suscripción cancelada",
        title: "Lamentamos verte partir.",
        body: `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">Tu suscripción <strong>${esc(data.plan_name)}</strong> fue cancelada y no se harán más cobros.</p><p style="margin:14px 0 0;font-size:12px;color:#9c9aa2">¿Fue un error? Siempre puedes reactivarla cuando quieras.</p>`,
        cta: { href: "https://queenshidro.com/membresia.html", label: "Ver planes" },
      }),
    };
  },

  subscription_charge(data: any) {
    return {
      subject: "Cobro confirmado — Queens Hidro",
      html: layout({
        kicker: "Cargo mensual",
        title: "Tu entrega mensual va en camino.",
        body: `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">Confirmamos tu cargo de <strong>${money(data.amount)}</strong> por tu suscripción <strong>${esc(data.plan_name)}</strong>. Te contactaremos para coordinar la entrega de este mes.</p>`,
        cta: { href: "https://queenshidro.com/cuenta.html", label: "Ver mi cuenta" },
      }),
    };
  },

  lead_internal(data: any) {
    return {
      subject: `Nuevo lead — ${esc(data.full_name)}`,
      html: layout({
        kicker: "Nuevo lead · Distribuye Queens",
        title: esc(data.full_name || "Sin nombre"),
        body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${label("Tipo", esc(data.lead_type || "—"))}
          ${label("Email", `<a href="mailto:${esc(data.email)}" style="color:#d4a845">${esc(data.email || "—")}</a>`)}
          ${label("Teléfono", esc(data.phone || "—"))}
          ${label("Empresa", esc(data.company || "—"))}
          ${label("Origen", esc(data.source || "—"))}
        </table>
        ${data.notes ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#e9e7e2"><span style="color:#9c9aa2">Mensaje:</span><br>${esc(data.notes)}</p>` : ""}`,
      }),
    };
  },

  lead_autoreply(data: any) {
    return {
      subject: "Gracias por tu interés en Queens Hidro",
      html: layout({
        kicker: "Distribuye Queens",
        title: `Gracias, ${esc(data.name)}.`,
        body: `<p style="margin:0;font-size:14px;line-height:1.7;color:#e9e7e2">Recibimos tu solicitud para distribuir Queens Hidro. Nuestro equipo la revisará y te contactará muy pronto con precios por volumen y condiciones.</p><p style="margin:14px 0 0;font-size:12px;color:#9c9aa2">Mientras tanto, puedes escribirnos a <a href="mailto:hola@queenshidro.com" style="color:#d4a845">hola@queenshidro.com</a>.</p>`,
      }),
    };
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  if (serviceKey && auth !== `Bearer ${serviceKey}`) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return json({ ok: false, error: "RESEND_API_KEY no configurado" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400); }

  const to = String(body.to || "").trim();
  const template = String(body.template || "");
  const data = body.data || {};

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return json({ ok: false, error: "Destinatario inválido" }, 400);
  }
  const render = TEMPLATES[template];
  if (!render) return json({ ok: false, error: "Plantilla desconocida" }, 400);

  const { subject, html } = render(data);
  const fromEmail = Deno.env.get("FROM_EMAIL") || "hola@queenshidro.com";

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `Queens Hidro <${fromEmail}>`, to: [to], subject, html }),
    });
    const resData: any = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("resend error:", res.status, resData);
      return json({ ok: false, error: resData?.message || "Error enviando el correo" }, 502);
    }
    return json({ ok: true, id: resData?.id });
  } catch (e: any) {
    console.error("send-email error:", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});
