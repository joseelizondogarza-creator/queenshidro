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

async function patchOrder(supabaseUrl: string, serviceKey: string, id: string, data: any) {
  return rest(supabaseUrl, serviceKey, `/rest/v1/orders?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(data),
  });
}

async function patchSubscription(supabaseUrl: string, serviceKey: string, id: string, data: any) {
  return rest(supabaseUrl, serviceKey, `/rest/v1/subscriptions?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(data),
  });
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

async function restoreOrderStock(supabaseUrl: string, serviceKey: string, orderId: string) {
  const { res, body: items } = await rest(
    supabaseUrl, serviceKey,
    `/rest/v1/order_items?select=product_id,quantity&order_id=eq.${orderId}`
  );
  if (!res.ok || !Array.isArray(items)) return;
  for (const it of items) {
    if (!it?.product_id) continue;
    await rest(supabaseUrl, serviceKey, "/rest/v1/rpc/increment_stock", {
      method: "POST",
      body: JSON.stringify({ p_product: it.product_id, qty: it.quantity }),
    });
  }
}

async function fetchMP(supabaseUrl: string, serviceKey: string, token: string, path: string) {
  const res = await fetch(`${MP_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return res.json();
}

async function handleOrderPayment(supabaseUrl: string, serviceKey: string, token: string, paymentId: string) {
  const p: any = await fetchMP(supabaseUrl, serviceKey, token, `/v1/payments/${paymentId}`);
  if (!p || !p.external_reference) return json({ ok: false, error: "Pago sin external_reference" }, 400);

  const orderId = String(p.external_reference);
  const { res: ordRes, body: ord } = await rest(
    supabaseUrl, serviceKey,
    `/rest/v1/orders?select=id,total,email,user_id,shipping_name,mp_payment_id,payment_status,status&id=eq.${orderId}`
  );
  const order = Array.isArray(ord) ? ord[0] : null;
  if (!ordRes.ok || !order) return json({ ok: false, error: "Orden no encontrada" }, 404);

  const expected = Number(order.total) || 0;
  const paid = Number(p.transaction_amount) || 0;
  if (Math.abs(paid - expected) > 0.01) {
    console.error("Amount mismatch", { order: orderId, expected, paid });
    return json({ ok: false, error: "El monto del pago no coincide con la orden" }, 400);
  }

  if (order.mp_payment_id === String(p.id) && order.payment_status === "pagado") {
    return json({ ok: true, dedup: true });
  }

  const approved = p.status === "approved";
  const rejected = ["rejected", "cancelled", "refunded", "charged_back"].includes(p.status);
  const pending = !approved && !rejected;
  if (pending && order.payment_status === "pagado") return json({ ok: true, dedup: true });

  const paymentStatus = approved ? "pagado" : rejected ? "rechazado" : "pendiente";
  await patchOrder(supabaseUrl, serviceKey, orderId, {
    mp_payment_id: String(p.id),
    mp_status: p.status,
    payment_status: paymentStatus,
    status: approved ? "confirmado" : rejected ? "cancelado" : "pendiente",
  });
  if (rejected) await restoreOrderStock(supabaseUrl, serviceKey, orderId);

  if (approved) {
    const email = order.email || (order.user_id ? await getUserEmail(supabaseUrl, serviceKey, order.user_id) : "");
    if (email) {
      const { body: items } = await rest(
        supabaseUrl, serviceKey,
        `/rest/v1/order_items?select=product_name,quantity,unit_price&order_id=eq.${orderId}`
      );
      await sendEmail(supabaseUrl, serviceKey, {
        to: email,
        template: "payment_confirmed",
        data: {
          name: order.shipping_name,
          order_id: orderId,
          total: order.total,
          items: Array.isArray(items) ? items : [],
        },
      });
    }
  }

  return json({ ok: true });
}

async function handleSubscriptionPrepaidPayment(supabaseUrl: string, serviceKey: string, token: string, paymentId: string) {
  const p: any = await fetchMP(supabaseUrl, serviceKey, token, `/v1/payments/${paymentId}`);
  if (!p || !p.external_reference) return json({ ok: false, error: "Pago sin external_reference" }, 400);

  const subId = String(p.external_reference).replace(/^sub_/, "");
  const { res: subRes, body: sub } = await rest(
    supabaseUrl, serviceKey,
    `/rest/v1/subscriptions?select=id,total_paid,payment_status,status,user_id,duration_months,billing_type,subscription_plans(name)&id=eq.${subId}`
  );
  const subscription = Array.isArray(sub) ? sub[0] : null;
  if (!subRes.ok || !subscription) return json({ ok: false, error: "Suscripción no encontrada" }, 404);

  const expected = Number(subscription.total_paid) || 0;
  const paid = Number(p.transaction_amount) || 0;
  if (Math.abs(paid - expected) > 0.01) {
    console.error("Sub amount mismatch", { sub: subId, expected, paid });
    return json({ ok: false, error: "El monto del pago no coincide con la suscripción" }, 400);
  }

  const approved = p.status === "approved";
  const rejected = ["rejected", "cancelled", "refunded", "charged_back"].includes(p.status);
  if (!approved && !rejected) return json({ ok: true }); // sigue pendiente

  await patchSubscription(supabaseUrl, serviceKey, subId, {
    mp_payment_id: String(p.id),
    payment_status: approved ? "pagado" : "rechazado",
    status: approved ? "active" : "cancelled",
    last_charge_at: approved ? new Date().toISOString() : null,
  });

  if (approved) {
    const email = await getUserEmail(supabaseUrl, serviceKey, subscription.user_id);
    if (email) {
      await sendEmail(supabaseUrl, serviceKey, {
        to: email,
        template: "subscription_active",
        data: {
          name: "",
          plan_name: subscription.subscription_plans?.name || "Queens Hidro",
          billing_type: subscription.billing_type,
          amount: subscription.total_paid,
          duration_months: subscription.duration_months,
        },
      });
    }
  }
  return json({ ok: true });
}

async function handlePreapproval(supabaseUrl: string, serviceKey: string, token: string, preapprovalId: string) {
  const pre: any = await fetchMP(supabaseUrl, serviceKey, token, `/preapproval/${preapprovalId}`);
  if (!pre || !pre.external_reference) return json({ ok: false, error: "Preapproval sin external_reference" }, 400);

  const subId = String(pre.external_reference);
  const { res: subRes, body: sub } = await rest(
    supabaseUrl, serviceKey,
    `/rest/v1/subscriptions?select=id,status,payment_status,user_id,total_paid,duration_months,billing_type,subscription_plans(name)&id=eq.${subId}`
  );
  const subscription = Array.isArray(sub) ? sub[0] : null;
  if (!subRes.ok || !subscription) return json({ ok: false, error: "Suscripción no encontrada" }, 404);

  if (pre.status === "authorized") {
    await patchSubscription(supabaseUrl, serviceKey, subId, {
      payment_status: "pagado",
      status: "active",
      last_charge_at: new Date().toISOString(),
    });
    const email = await getUserEmail(supabaseUrl, serviceKey, subscription.user_id);
    if (email) {
      await sendEmail(supabaseUrl, serviceKey, {
        to: email,
        template: "subscription_active",
        data: {
          name: "",
          plan_name: subscription.subscription_plans?.name || "Queens Hidro",
          billing_type: subscription.billing_type,
          amount: subscription.total_paid,
          duration_months: subscription.duration_months,
        },
      });
    }
  } else if (pre.status === "cancelled" || pre.status === "rejected") {
    await patchSubscription(supabaseUrl, serviceKey, subId, {
      payment_status: "rechazado",
      status: "cancelled",
    });
  }
  return json({ ok: true });
}

async function handleAuthorizedPayment(supabaseUrl: string, serviceKey: string, token: string, paymentId: string) {
  const p: any = await fetchMP(supabaseUrl, serviceKey, token, `/v1/payments/${paymentId}`);
  if (!p) return json({ ok: false, error: "Pago no encontrado" }, 404);

  // Vincular el cargo mensual a la suscripción (preapproval_id o external_reference)
  const subId = String(p.preapproval_id || p.external_reference || "").replace(/^sub_/, "");
  if (!subId) return json({ ok: false, error: "No se pudo vincular el pago a una suscripción" }, 400);

  const { res: subRes, body: sub } = await rest(
    supabaseUrl, serviceKey,
    `/rest/v1/subscriptions?select=id,current_period_end,payment_status,user_id,subscription_plans(name)&id=eq.${subId}`
  );
  const subscription = Array.isArray(sub) ? sub[0] : null;
  if (!subRes.ok || !subscription) return json({ ok: false, error: "Suscripción no encontrada" }, 404);

  const approved = p.status === "approved";
  if (!approved) {
    await patchSubscription(supabaseUrl, serviceKey, subId, {
      payment_status: "rechazado",
      status: "cancelled",
    });
    return json({ ok: true });
  }

  const base = subscription.current_period_end && new Date(subscription.current_period_end) > new Date()
    ? new Date(subscription.current_period_end)
    : new Date();
  const nextEnd = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await patchSubscription(supabaseUrl, serviceKey, subId, {
    payment_status: "pagado",
    status: "active",
    current_period_end: nextEnd,
    last_charge_at: new Date().toISOString(),
  });

  const email = await getUserEmail(supabaseUrl, serviceKey, subscription.user_id);
  if (email) {
    await sendEmail(supabaseUrl, serviceKey, {
      to: email,
      template: "subscription_charge",
      data: {
        name: "",
        plan_name: subscription.subscription_plans?.name || "Queens Hidro",
        amount: p.transaction_amount || subscription.total_paid || 0,
      },
    });
  }
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const token = Deno.env.get("MP_ACCESS_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!token) return json({ ok: false, error: "MP_ACCESS_TOKEN no configurado" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { /* cuerpo vacío */ }

  const type = body.type || "";
  const paymentId = body.data?.id ?? body.payment_id ?? body.id;

  try {
    if (type === "subscription_preapproval" && body.data?.id) {
      return await handlePreapproval(supabaseUrl, serviceKey, token, String(body.data.id));
    }
    if (type === "subscription_authorized_payment" && body.data?.id) {
      return await handleAuthorizedPayment(supabaseUrl, serviceKey, token, String(body.data.id));
    }
    if (!paymentId) return json({ ok: false, error: "Sin payment id" }, 400);

    // Pago normal: puede ser de una orden o de una suscripción prepago (external_reference = 'sub_<id>')
    const p: any = await fetchMP(supabaseUrl, serviceKey, token, `/v1/payments/${paymentId}`);
    if (!p || !p.external_reference) return json({ ok: false, error: "Pago sin external_reference" }, 400);
    if (String(p.external_reference).startsWith("sub_")) {
      return await handleSubscriptionPrepaidPayment(supabaseUrl, serviceKey, token, paymentId);
    }
    return await handleOrderPayment(supabaseUrl, serviceKey, token, paymentId);
  } catch (e: any) {
    console.error("mp-webhook error:", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});
