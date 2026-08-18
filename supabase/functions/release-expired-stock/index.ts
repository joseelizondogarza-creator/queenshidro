import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Solo órdenes de Mercado Pago: las de transferencia se gestionan manualmente
    const res = await fetch(
      `${supabaseUrl}/rest/v1/orders?select=id,order_items(product_id,quantity)&status=eq.pendiente&payment_status=eq.pendiente&payment_method=neq.transferencia&expires_at=lt.${encodeURIComponent(new Date().toISOString())}&limit=50`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (!res.ok) return json({ ok: false, error: "No se pudieron consultar las órdenes" }, 502);
    const orders: any = await res.json();
    if (!Array.isArray(orders) || !orders.length) return json({ ok: true, released: 0 });

    let released = 0;
    for (const order of orders) {
      const items = Array.isArray(order.order_items) ? order.order_items : [];
      for (const it of items) {
        if (!it?.product_id) continue;
        await fetch(`${supabaseUrl}/rest/v1/rpc/increment_stock`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ p_product: it.product_id, qty: it.quantity }),
        });
      }
      await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ status: "cancelado" }),
      });
      released++;
    }

    return json({ ok: true, released });
  } catch (e: any) {
    console.error("release-expired-stock error:", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});
