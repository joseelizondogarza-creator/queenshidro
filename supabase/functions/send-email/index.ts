import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ============================================================
// Queens Hidro — Envío de correos transaccionales (Resend)
// Uso interno: las demás edge functions invocan este endpoint
// con Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>.
// Body: { to, template, data }
//
// Diseño: editorial dark, tipografía Fraunces / IBM Plex Mono /
// Inter, acentos frambuesa #e10357, oro #d4a845 y teal #02b4b7.
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

const SANS = "'Inter','Segoe UI',Arial,Helvetica,sans-serif";
const SERIF = "'Fraunces',Georgia,'Times New Roman',serif";
const MONO = "'IBM Plex Mono',Consolas,'Courier New',monospace";

// ---------- Layout compartido ----------
function layout(opts: {
  kicker: string;
  title: string;
  body: string;
  preheader?: string;
  cta?: { href: string; label: string };
}) {
  const cta = opts.cta
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 4px"><tr><td align="center" style="border-radius:2px;background:#d4a845"><a href="${esc(opts.cta.href)}" style="display:inline-block;padding:15px 38px;font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0c;text-decoration:none">${esc(opts.cta.label)}</a></td></tr></table>`
    : "";
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(opts.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif !important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#0a0a0c;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;word-spacing:normal;font-family:${SANS}">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:#0a0a0c;font-size:0">${esc(opts.preheader || opts.kicker)}</span>
<div role="article" aria-roledescription="email" lang="es" style="background:#0a0a0c;color:#e9e7e2">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c">
    <tr><td align="center" style="padding:24px 16px 40px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0a0c">

        <!-- HEADER -->
        <tr><td style="padding:34px 32px 0;border-top:3px solid #e10357">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-family:${SERIF};font-size:24px;letter-spacing:0.08em;color:#e9e7e2;font-weight:600">QUEENS&nbsp;HIDRO</td>
            <td style="text-align:right;font-family:${MONO};font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:#d4a845">Hidromiel<br>Artesanal</td>
          </tr></table>
        </td></tr>

        <!-- KICKER + TITLE -->
        <tr><td style="padding:40px 32px 0">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td width="28" style="border-top:1px solid #e10357"></td>
            <td style="padding-left:14px;font-family:${MONO};font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#9c9aa2">${esc(opts.kicker)}</td>
          </tr></table>
          <h1 style="margin:16px 0 0;font-family:${SERIF};font-size:30px;line-height:1.15;color:#e9e7e2;font-weight:400;letter-spacing:-0.01em">${opts.title}</h1>
        </td></tr>

        <!-- CARD -->
        <tr><td style="padding:28px 32px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:2px">
            <tr><td style="padding:30px 30px 26px">
              ${opts.body}
            </td></tr>
          </table>
        </td></tr>

        ${cta}

        <!-- FOOTER -->
        <tr><td style="padding:36px 32px 0;border-top:1px solid rgba(255,255,255,0.08)">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-family:${SERIF};font-size:15px;letter-spacing:0.06em;color:#e9e7e2">Queens Hidro</td>
            <td align="right" style="font-family:${MONO};font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#9c9aa2">Monterrey, NL</td>
          </tr></table>
          <p style="margin:16px 0 0;font-size:11px;line-height:1.8;color:#9c9aa2;font-family:${SANS}">
            <a href="https://queenshidro.com" style="color:#d4a845;text-decoration:none">queenshidro.com</a>
            &nbsp;·&nbsp;
            <a href="https://instagram.com/queenshidro" style="color:#d4a845;text-decoration:none">@queenshidro</a>
            &nbsp;·&nbsp;
            <a href="mailto:hola@queenshidro.com" style="color:#d4a845;text-decoration:none">hola@queenshidro.com</a>
          </p>
          <p style="margin:14px 0 0;padding:14px 16px;background:#0e0e12;border:1px solid rgba(255,255,255,0.06);font-size:10px;line-height:1.7;color:#9c9aa2;font-family:${SANS}">
            <strong style="color:#e9e7e2;letter-spacing:0.1em">+18</strong>
            &nbsp;Prohibida la venta a menores de 18 años. Consume con responsabilidad.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px 32px">
          <p style="margin:0;font-size:9px;letter-spacing:0.12em;color:#56545c;font-family:${MONO}">© 2026 QUEENS HIDRO · HIDROMIEL DE FRUTA REAL Y MIEL MEXICANA</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</div>
</body>
</html>`;
}

function label(text: string, value: string) {
  return `<tr>
    <td style="padding:9px 0;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9c9aa2">${esc(text)}</td>
    <td style="padding:9px 0;text-align:right;font-size:14px;color:#e9e7e2">${value}</td>
  </tr>`;
}

function hr() {
  return `<tr><td colspan="2" style="padding:2px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid rgba(255,255,255,0.08)"></td></tr></table></td></tr>`;
}

function itemsTable(items: unknown) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return "";
  const trs = rows
    .map((i: any) => {
      const qty = Math.max(1, Number(i?.quantity) || 1);
      const price = Number(i?.unit_price) || 0;
      return `<tr>
        <td style="padding:10px 0;font-size:14px;color:#e9e7e2;border-bottom:1px solid rgba(255,255,255,0.05)">${esc(i?.name || i?.product_name || "Producto")} <span style="color:#9c9aa2;font-family:${MONO};font-size:11px">× ${qty}</span></td>
        <td style="padding:10px 0;text-align:right;font-size:14px;color:#e9e7e2;border-bottom:1px solid rgba(255,255,255,0.05)">${money(price * qty)}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">${trs}</table>`;
}

function totalsTable(data: any) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
    <tr><td style="padding:8px 0;font-size:12px;color:#9c9aa2">Subtotal</td><td style="padding:8px 0;text-align:right;font-size:13px;color:#e9e7e2">${money(data.subtotal)}</td></tr>
    <tr><td style="padding:8px 0;font-size:12px;color:#9c9aa2">Envío</td><td style="padding:8px 0;text-align:right;font-size:13px;color:#e9e7e2">${money(data.shipping_fee)}</td></tr>
    <tr><td style="padding:12px 0 4px;border-top:1px solid rgba(255,255,255,0.12);font-size:14px;color:#e9e7e2;font-weight:600">Total</td><td style="padding:12px 0 4px;border-top:1px solid rgba(255,255,255,0.12);text-align:right;font-size:16px;color:#d4a845;font-weight:600;font-family:${MONO}">${money(data.total)}</td></tr>
  </table>`;
}

function greeting(name: unknown) {
  const n = String(name || "").trim();
  if (!n) return "Hola,";
  const first = n.split(/\s+/)[0];
  return `Hola, ${esc(first)}.`;
}

// ---------- Plantillas ----------
const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  order_received(data: any) {
    const oid = shortId(data.order_id);
    return {
      subject: `Recibimos tu pedido #${oid}`,
      html: layout({
        preheader: `Tu pedido #${oid} quedó registrado. Te avisamos en cuanto confirmemos tu pago.`,
        kicker: "Pedido recibido",
        title: `${greeting(data.name)}`,
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">Recibimos tu pedido <strong style="color:#d4a845">#${oid}</strong>. En cuanto confirmemos tu pago te avisamos para coordinar la entrega.</p>${itemsTable(data.items)}${totalsTable(data)}`,
      }),
    };
  },

  transfer_instructions(data: any) {
    const oid = shortId(data.order_id);
    const b = data.bank || {};
    const body = `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">Tu pedido <strong style="color:#d4a845">#${oid}</strong> quedó registrado con pago por <strong>transferencia bancaria</strong>. Realiza el depósito por el total exacto para que lo confirmemos.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">
        ${label("Total a transferir", `<strong style="color:#d4a845;font-family:${MONO}">${money(data.total)}</strong>`)}
        ${hr()}
        ${b.bank ? label("Banco", esc(b.bank)) : ""}
        ${b.holder ? label("Titular", esc(b.holder)) : ""}
        ${b.clabe ? label("CLABE", `<span style="font-family:${MONO};letter-spacing:0.04em">${esc(b.clabe)}</span>`) : ""}
        ${b.account ? label("Cuenta", `<span style="font-family:${MONO};letter-spacing:0.04em">${esc(b.account)}</span>`) : ""}
      </table>
      ${b.instructions ? `<p style="margin:16px 0 0;padding:14px 16px;background:#0e0e12;border-left:2px solid #d4a845;font-size:12px;line-height:1.7;color:#9c9aa2">${esc(b.instructions)}</p>` : ""}
      <p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:#9c9aa2">Envía tu comprobante por Instagram <strong style="color:#e9e7e2">@queenshidro</strong> o WhatsApp y confirmamos tu pedido.</p>`;
    return {
      subject: `Completa tu transferencia — pedido #${oid}`,
      html: layout({
        preheader: `Datos bancarios para completar tu pedido #${oid}.`,
        kicker: "Pago por transferencia",
        title: `${greeting(data.name)}`,
        body,
      }),
    };
  },

  payment_confirmed(data: any) {
    const oid = shortId(data.order_id);
    return {
      subject: `Pago confirmado — pedido #${oid}`,
      html: layout({
        preheader: `Tu pago fue confirmado. Tu pedido #${oid} está en preparación.`,
        kicker: "Pago confirmado",
        title: "¡Tu pago fue confirmado!",
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">Recibimos tu pago por <strong style="color:#3ee0e3">${money(data.total)}</strong>. Tu pedido <strong style="color:#d4a845">#${oid}</strong> está en preparación y te contactaremos para coordinar la entrega.</p>${itemsTable(data.items)}${totalsTable({ ...data, subtotal: data.subtotal ?? data.total ?? 0, shipping_fee: data.shipping_fee ?? 0 })}`,
      }),
    };
  },

  order_shipped(data: any) {
    const oid = shortId(data.order_id);
    const entregado = data.status === "entregado";
    return {
      subject: entregado ? `Tu pedido #${oid} fue entregado` : `Tu pedido #${oid} va en camino`,
      html: layout({
        preheader: entregado ? `Tu pedido #${oid} fue entregado. ¡Disfrútalo!` : `Tu pedido #${oid} ya salió a reparto.`,
        kicker: entregado ? "Entrega completada" : "En camino",
        title: entregado ? "Tu pedido fue entregado." : "Tu pedido va en camino.",
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">${
          entregado
            ? `Tu pedido <strong style="color:#d4a845">#${oid}</strong> fue entregado. ¡Disfrútalo y consume con responsabilidad!`
            : `Tu pedido <strong style="color:#d4a845">#${oid}</strong> ya salió a reparto. Pronto lo tendrás en la puerta de tu casa.`
        }</p>
        <p style="margin:16px 0 0;padding:14px 16px;background:#0e0e12;border-left:2px solid #02b4b7;font-size:12px;line-height:1.7;color:#9c9aa2">¿Dudas? Escríbenos a <a href="mailto:hola@queenshidro.com" style="color:#d4a845;text-decoration:none">hola@queenshidro.com</a></p>`,
      }),
    };
  },

  subscription_active(data: any) {
    const recurrente = data.billing_type === "recurring";
    const importe = recurrente
      ? `${money(data.amount)} <span style="color:#9c9aa2;font-size:12px">/ mes</span>`
      : `${money(data.amount)} <span style="color:#9c9aa2;font-size:12px">(${esc(data.duration_months || "")} meses)</span>`;
    return {
      subject: "Tu suscripción Queens Hidro está activa",
      html: layout({
        preheader: `Tu suscripción ${data.plan_name} quedó activada. ¡Bienvenida a la tribu!`,
        kicker: "Suscripción activa",
        title: "¡Bienvenida a la tribu!",
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">${greeting(data.name)} Tu suscripción <strong style="color:#d4a845">${esc(data.plan_name)}</strong> quedó activada.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">
            ${label("Plan", `<strong style="color:#d4a845">${esc(data.plan_name)}</strong>`)}
            ${hr()}
            ${label("Modalidad", recurrente ? "Mensual · renovable" : "Prepago")}
            ${label("Cargo", `<strong style="color:#3ee0e3;font-family:${MONO}">${importe}</strong>`)}
          </table>
          <p style="margin:16px 0 0;padding:14px 16px;background:#0e0e12;border-left:2px solid #d4a845;font-size:12px;line-height:1.7;color:#9c9aa2">Con tu membresía, tus pedidos de la tienda pagan envío preferencial de suscriptor.</p>`,
        cta: { href: "https://queenshidro.com/cuenta.html", label: "Ver mi cuenta" },
      }),
    };
  },

  subscription_charge(data: any) {
    return {
      subject: "Cobro confirmado — Queens Hidro",
      html: layout({
        preheader: `Confirmamos tu cargo de ${money(data.amount)}. Tu entrega mensual va en camino.`,
        kicker: "Cargo mensual",
        title: "Tu entrega mensual va en camino.",
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">${greeting(data.name)} Confirmamos tu cargo de <strong style="color:#3ee0e3;font-family:${MONO}">${money(data.amount)}</strong> por tu suscripción <strong style="color:#d4a845">${esc(data.plan_name)}</strong>. Te contactaremos para coordinar la entrega de este mes.</p>`,
        cta: { href: "https://queenshidro.com/cuenta.html", label: "Ver mi cuenta" },
      }),
    };
  },

  subscription_cancelled(data: any) {
    return {
      subject: "Suscripción cancelada",
      html: layout({
        preheader: `Tu suscripción ${data.plan_name} fue cancelada y no se harán más cobros.`,
        kicker: "Suscripción cancelada",
        title: "Lamentamos verte partir.",
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">${greeting(data.name)} Tu suscripción <strong style="color:#d4a845">${esc(data.plan_name)}</strong> fue cancelada y no se harán más cobros.</p>
        <p style="margin:16px 0 0;padding:14px 16px;background:#0e0e12;border-left:2px solid #ff3d7d;font-size:12px;line-height:1.7;color:#9c9aa2">¿Fue un error? Siempre puedes reactivarla cuando quieras.</p>`,
        cta: { href: "https://queenshidro.com/membresia.html", label: "Ver planes" },
      }),
    };
  },

  tasting_internal(data: any) {
    const local = data.request_type === "local";
    return {
      subject: `${local ? "Nueva visita" : "Nueva solicitud nacional"} — ${esc(data.company || data.full_name)}`,
      html: layout({
        preheader: `${local ? "Solicitud de visita" : "Solicitud de degustación nacional"}: ${data.company || data.full_name}`,
        kicker: local ? "Degustación · Visita local" : "Degustación · Solicitud nacional",
        title: esc(data.company || data.full_name || "Nueva solicitud"),
        body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${label("Fecha tentativa", esc(data.desired_date || "—"))}
          ${hr()}
          ${label("Ubicación", esc(data.location || "—"))}
          ${label("Formato", esc(data.lead_type || "—"))}
          ${label("Volumen", esc(data.desired_volume || "—"))}
          ${hr()}
          ${label("Contacto", esc(data.full_name || "—"))}
          ${label("Email", `<a href="mailto:${esc(data.email)}" style="color:#d4a845;text-decoration:none">${esc(data.email || "—")}</a>`)}
          ${label("Teléfono", esc(data.phone || "—"))}
        </table>
        ${data.notes ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#e9e7e2"><span style="color:#9c9aa2;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase">Notas</span><br>${esc(data.notes)}</p>` : ""}`,
      }),
    };
  },

  tasting_confirmation(data: any) {
    const local = data.request_type === "local";
    const title = local ? "Recibimos tu solicitud de visita." : "Recibimos tu solicitud de degustación.";
    const copy = local
      ? `Recibimos tu solicitud para una visita de degustación en <strong style="color:#d4a845">${esc(data.company || "tu negocio")}</strong>. La fecha que elegiste es tentativa; te contactaremos para confirmar el siguiente paso.`
      : `Recibimos tu solicitud para una degustación en <strong style="color:#d4a845">${esc(data.company || "tu negocio")}</strong>. Revisaremos los datos y te contactaremos para confirmar si podemos avanzar con el kit.`;
    return {
      subject: local ? "Recibimos tu solicitud de visita — Queens Hidro" : "Recibimos tu solicitud de degustación — Queens Hidro",
      html: layout({
        preheader: local ? "Recibimos tu solicitud de visita." : "Recibimos tu solicitud de degustación.",
        kicker: local ? "Degustación · Visita local" : "Degustación · Solicitud nacional",
        title,
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">${greeting(data.name)} ${copy}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">
            ${label("Fecha tentativa", esc(data.desired_date || "—"))}
            ${hr()}
            ${label("Ubicación", esc(data.location || "—"))}
            ${label("Formato", esc(data.lead_type || "—"))}
          </table>
          <p style="margin:16px 0 0;padding:14px 16px;background:#0e0e12;border-left:2px solid #02b4b7;font-size:12px;line-height:1.7;color:#9c9aa2">Esta solicitud no es una confirmación automática. Si tienes alguna duda, escríbenos a <a href="mailto:hola@queenshidro.com" style="color:#d4a845;text-decoration:none">hola@queenshidro.com</a>.</p>`,
      }),
    };
  },

  lead_internal(data: any) {
    return {
      subject: `Nuevo lead — ${esc(data.full_name)}`,
      html: layout({
        preheader: `Nuevo lead de Distribuye Queens: ${data.full_name}`,
        kicker: "Nuevo lead · Distribuye Queens",
        title: esc(data.full_name || "Sin nombre"),
        body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${label("Tipo", esc(data.lead_type || "—"))}
          ${hr()}
          ${label("Email", `<a href="mailto:${esc(data.email)}" style="color:#d4a845;text-decoration:none">${esc(data.email || "—")}</a>`)}
          ${label("Teléfono", esc(data.phone || "—"))}
          ${label("Empresa", esc(data.company || "—"))}
          ${label("Origen", esc(data.source || "—"))}
        </table>
        ${data.notes ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#e9e7e2"><span style="color:#9c9aa2;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase">Mensaje</span><br>${esc(data.notes)}</p>` : ""}`,
      }),
    };
  },

  lead_autoreply(data: any) {
    return {
      subject: "Gracias por tu interés en Queens Hidro",
      html: layout({
        preheader: "Recibimos tu solicitud para distribuir Queens Hidro. Te contactaremos pronto.",
        kicker: "Distribuye Queens",
        title: `Gracias, ${esc(data.name || "")}.`,
        body: `<p style="margin:0;font-size:15px;line-height:1.75;color:#e9e7e2">Recibimos tu solicitud para distribuir Queens Hidro. Nuestro equipo la revisará y te contactará muy pronto con precios por volumen y condiciones.</p>
        <p style="margin:16px 0 0;padding:14px 16px;background:#0e0e12;border-left:2px solid #d4a845;font-size:12px;line-height:1.7;color:#9c9aa2">Mientras tanto, puedes escribirnos a <a href="mailto:hola@queenshidro.com" style="color:#d4a845;text-decoration:none">hola@queenshidro.com</a>.</p>`,
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
