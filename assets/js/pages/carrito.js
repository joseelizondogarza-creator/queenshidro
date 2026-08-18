/* ============================================================
   QUEENS HIDRO — Carrito / Checkout
   Usa el módulo compartido window.QH.cart (localStorage + sync
   con Supabase). La orden se crea 100% server-side vía la edge
   function create-order (precios/stock validados en la BD).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var sb = window.QH.sb;
    var cartModule = window.QH.cart;
    if (!cartModule) return;

    var backUrl = window.location.origin + window.location.pathname;

    var bankInfo = null;
    function loadBankInfo() {
        return sb.from('site_content').select('key,value').eq('section', 'pago').then(function (r) {
            var m = {};
            (r.data || []).forEach(function (c) { if (c.key) m[c.key] = c.value; });
            bankInfo = {
                bank: m.transfer_bank || '',
                holder: m.transfer_holder || '',
                clabe: m.transfer_clabe || '',
                account: m.transfer_account || '',
                instructions: m.transfer_instructions || ''
            };
            renderTransferInfo();
            return bankInfo;
        }).catch(function () { return null; });
    }
    function renderTransferInfo() {
        var el = document.getElementById('transferInfo');
        if (!el || !bankInfo) return;
        if (!bankInfo.clabe) {
            el.innerHTML = '<div class="transfer-info__note">La información de transferencia aún no está configurada. Contáctanos por Instagram.</div>';
            return;
        }
        el.innerHTML =
            '<div class="transfer-info__row"><span>Banco</span><span>' + bankInfo.bank + '</span></div>' +
            '<div class="transfer-info__row"><span>Titular</span><span>' + bankInfo.holder + '</span></div>' +
            '<div class="transfer-info__row"><span>CLABE</span><span class="transfer-info__clabe">' + bankInfo.clabe + '</span></div>' +
            (bankInfo.account ? '<div class="transfer-info__row"><span>Cuenta</span><span>' + bankInfo.account + '</span></div>' : '') +
            '<div class="transfer-info__note">' + bankInfo.instructions + '</div>';
    }
    window._qhSetPay = function (method) {
        document.querySelectorAll('.pay-method__opt').forEach(function (o) {
            var on = o.dataset.method === method;
            o.classList.toggle('selected', on);
            var inp = o.querySelector('input');
            if (inp) inp.checked = on;
        });
        var ti = document.getElementById('transferInfo');
        if (ti) ti.classList.toggle('open', method === 'transferencia');
        var note = document.getElementById('checkoutNote');
        var btn = document.getElementById('btnPlaceOrder');
        if (method === 'transferencia') {
            if (note) note.innerHTML = '<i class="bi bi-bank"></i> Transferencia directa: confirma tu pedido y envíanos tu comprobante.';
            if (btn) btn.textContent = 'Confirmar pedido por transferencia';
        } else {
            if (note) note.innerHTML = '<i class="bi bi-shield-lock"></i> Pago seguro vía Mercado Pago. Puedes pagar con tarjeta.';
            if (btn) btn.textContent = 'Realizar pedido y pagar';
        }
    };

    /* ================= Resultado de pago ================= */
    function screen(html) {
        document.getElementById('cartItemCount').textContent = '';
        document.getElementById('cartContent').innerHTML = html;
    }

    function showPaymentResult() {
        var params = new URLSearchParams(window.location.search);
        var result = params.get('payment');
        if (!result) return false;
        var orderId = sessionStorage.getItem('qh_order_id');
        var shortId = orderId ? orderId.slice(0, 8) : '';

        if (result === 'success' && orderId) {
            var attempts = 0;
            (function poll() {
                attempts++;
                sb.functions.invoke('verify-payment', { body: { order_id: orderId } })
                    .then(function (resp) {
                        var st = resp.data && resp.data.payment_status;
                        if (st === 'pagado') {
                            cartModule.clear();
                            sessionStorage.removeItem('qh_order_id');
                            localStorage.removeItem('qh_cart_backup');
                            screen('<div class="order-confirm">' +
                                '<div class="order-confirm__icon"><i class="bi bi-emoji-smile"></i></div>' +
                                '<p class="order-confirm__title">¡Pago confirmado!</p>' +
                                '<p class="order-confirm__sub">Tu orden <strong>#' + shortId + '</strong> fue pagada correctamente. Te contactaremos pronto para coordinar la entrega.</p>' +
                                '<a href="tienda.html" class="cart-empty__link">Seguir comprando</a>' +
                            '</div>');
                        } else if (st === 'rechazado') {
                            finishFailure();
                        } else if (attempts < 6) {
                            setTimeout(poll, 2000);
                        } else {
                            finishPending(orderId, true);
                        }
                    })
                    .catch(function () {
                        if (attempts < 6) setTimeout(poll, 2000);
                        else finishPending(orderId, true);
                    });
            })();
            return true;
        }

        if (result === 'pending' && orderId) {
            finishPending(orderId, false);
            return true;
        }

        if (result === 'failure') {
            finishFailure();
            return true;
        }

        return false;
    }

    function finishPending(orderId, unsure) {
        var shortId = orderId.slice(0, 8);
        sessionStorage.removeItem('qh_order_id');
        screen('<div class="order-confirm">' +
            '<div class="order-confirm__icon"><i class="bi bi-hourglass-split"></i></div>' +
            '<p class="order-confirm__title">Pago pendiente</p>' +
            '<p class="order-confirm__sub">' + (unsure ? 'Estamos confirmando tu pago. ' : '') + 'Tu orden <strong>#' + shortId + '</strong> quedó registrada. La confirmación puede tardar unos minutos.</p>' +
            '<div class="order-confirm__steps">' +
                '<div><i class="bi bi-check2-circle"></i>Guarda tu número de orden: <strong>#' + shortId + '</strong></div>' +
                '<div><i class="bi bi-check2-circle"></i>Si tu pago no se confirma en 30 min, escríbenos con tu número de orden</div>' +
                '<div><i class="bi bi-check2-circle"></i>Consume con responsabilidad, +18</div>' +
            '</div>' +
            '<div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">' +
                '<a href="cuenta.html" class="cart-empty__link">Mis pedidos</a>' +
                '<a href="tienda.html" class="cart-empty__link" style="border-color:rgba(255,255,255,.2);color:var(--muted)">Seguir comprando</a>' +
            '</div>' +
        '</div>');
    }

    function finishFailure() {
        sessionStorage.removeItem('qh_order_id');
        var backup = localStorage.getItem('qh_cart_backup');
        if (backup) {
            localStorage.setItem('qh_cart', backup);
            localStorage.removeItem('qh_cart_backup');
        }
        cartModule.reload();
        screen('<div class="order-confirm">' +
            '<div class="order-confirm__icon"><i class="bi bi-x-circle"></i></div>' +
            '<p class="order-confirm__title">Pago no completado</p>' +
            '<p class="order-confirm__sub">No se te cobró nada. Tu carrito está intacto y puedes intentarlo de nuevo cuando quieras.</p>' +
            '<a href="carrito.html" class="cart-empty__link">Reintentar pago</a>' +
        '</div>');
    }

    function finishTransfer(orderId, bank, total) {
        var shortId = orderId ? orderId.slice(0, 8) : '';
        var b = bank || {};
        sessionStorage.removeItem('qh_order_id');
        screen('<div class="order-confirm">' +
            '<div class="order-confirm__icon"><i class="bi bi-bank"></i></div>' +
            '<p class="order-confirm__title">Pedido registrado</p>' +
            '<p class="order-confirm__sub">Tu orden <strong>#' + shortId + '</strong> quedó registrada con pago por transferencia.</p>' +
            '<div class="order-confirm__bank">' +
                '<div><span>Total a transferir:</span> <strong>' + cartModule.fmt(total) + '</strong></div>' +
                (b.bank ? '<div><span>Banco:</span> <strong>' + b.bank + '</strong></div>' : '') +
                (b.holder ? '<div><span>Titular:</span> <strong>' + b.holder + '</strong></div>' : '') +
                (b.clabe ? '<div><span>CLABE:</span> <strong>' + b.clabe + '</strong></div>' : '') +
                (b.account ? '<div><span>Cuenta:</span> <strong>' + b.account + '</strong></div>' : '') +
            '</div>' +
            (b.instructions ? '<p class="order-confirm__sub">' + b.instructions + '</p>' : '') +
            '<p class="order-confirm__sub">Envía tu comprobante por Instagram (@queenshidro) o WhatsApp y te confirmamos el pedido.</p>' +
            '<div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">' +
                '<a href="cuenta.html" class="cart-empty__link">Mis pedidos</a>' +
                '<a href="tienda.html" class="cart-empty__link" style="border-color:rgba(255,255,255,.2);color:var(--muted)">Seguir comprando</a>' +
            '</div>' +
        '</div>');
    }

    /* ================= Carrito ================= */
    function loadShippingData() {
        try { return JSON.parse(localStorage.getItem('qh_shipping')) || {}; }
        catch (e) { return {}; }
    }
    function saveShippingData(data) {
        try { localStorage.setItem('qh_shipping', JSON.stringify(data)); }
        catch (e) {}
    }

    function showToast(msg, type) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;top:24px;right:24px;z-index:10000;padding:14px 24px;border-radius:2px;font-size:0.72rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;font-family:var(--font-m);animation:slideInToast 0.3s ease;box-shadow:0 8px 30px rgba(0,0,0,0.5);pointer-events:none;max-width:340px';
        if (type === 'err') { t.style.background = '#1c0a10'; t.style.border = '1px solid rgba(255,77,109,0.4)'; t.style.color = '#ff4d6d'; }
        else { t.style.background = '#051412'; t.style.border = '1px solid rgba(2,180,183,0.4)'; t.style.color = '#3ee0e3'; }
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 3500);
    }

    function showUndoToast(msg, onUndo) {
        var t = document.createElement('div');
        t.className = 'toast-undo';
        var txt = document.createElement('span');
        txt.textContent = msg;
        var btn = document.createElement('button');
        btn.textContent = 'Deshacer';
        btn.addEventListener('click', function () { onUndo(); t.remove(); });
        t.appendChild(txt);
        t.appendChild(btn);
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 9000);
    }

    function maxFor(item) {
        var s = cartModule.settings();
        var max = s.maxQty;
        if (item.stock !== null && item.stock !== undefined) max = Math.min(max, item.stock);
        return Math.max(1, max);
    }

    function renderCart() {
        var container = document.getElementById('cartContent');
        var countEl = document.getElementById('cartItemCount');
        var items = cartModule.items();
        var s = cartModule.settings();
        var subtotal = cartModule.subtotal();
        var shipping = cartModule.shippingFee();
        var total = cartModule.total();

        if (!items.length) {
            countEl.textContent = '';
            container.innerHTML = '<div class="cart-empty">' +
                '<div class="cart-empty__icon"><i class="bi bi-basket"></i></div>' +
                '<p class="cart-empty__text">Tu carrito está vacío. Explora nuestros hidromieles.</p>' +
                '<p style="font-size:0.9rem;color:var(--muted);margin-bottom:24px">¿Agregaste algo antes? <a href="login.html" style="color:var(--gold-hi);font-weight:600">Inicia sesión</a> para recuperar tu carrito.</p>' +
                '<a href="tienda.html" class="cart-empty__link">Ir a la tienda</a>' +
            '</div>';
            return;
        }

        countEl.textContent = items.length + ' producto' + (items.length !== 1 ? 's' : '');
        var isSub = cartModule.isSubscriber();
        var shippingLabel = isSub
            ? '<span>Envío</span><span>' + cartModule.fmt(shipping) + ' <span class="cart-ship-badge">Suscriptor</span></span>'
            : '<span>Envío</span><span>' + cartModule.fmt(shipping) + '</span>';
        var ctaHtml = isSub
            ? ''
            : '<div class="cart-sub-cta"><i class="bi bi-stars"></i><span>Con suscripción pagas <strong>' + cartModule.fmt(cartModule.settings().shippingFlatSubscriber) + '</strong> de envío en vez de ' + cartModule.fmt(shipping) + '. <a href="membresia.html">Ver planes</a></span></div>';

        container.innerHTML = '<div class="cart-layout">' +
            '<div class="cart-items">' +
                '<p class="cart-section-hdr cart-section-hdr--row">Tu pedido' +
                    '<button class="btn-clear" id="btnClearCart"><i class="bi bi-trash3"></i> Vaciar</button>' +
                '</p>' +
                items.map(function (item) {
                    var sub = item.price * item.quantity;
                    var specs = [item.alcohol_percent ? item.alcohol_percent + '% alc' : '', item.volume_ml ? item.volume_ml + 'ml' : '', item.sweetness || ''].filter(Boolean).join(' · ');
                    var imgHtml = item.image_url ? '<img src="' + item.image_url + '" alt="' + item.name + '">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem"><i class="bi bi-cup-straw"></i></div>';
                    var max = maxFor(item);
                    var warn = '';
                    if (item.stock !== null && item.stock <= 0) {
                        warn = '<p class="cart-item__stockwarn" style="color:var(--red)">Agotado — se quitará al pagar</p>';
                    }
                    var plusDisabled = item.quantity >= max ? ' style="opacity:.35;cursor:not-allowed"' : '';
                    return '<div class="cart-item">' +
                        '<div class="cart-item__img">' + imgHtml + '</div>' +
                        '<div class="cart-item__info">' +
                            '<p class="cart-item__name">' + item.name + '</p>' +
                            '<p class="cart-item__specs">' + specs + '</p>' +
                            '<div class="cart-item__qty">' +
                                '<button onclick="window._cqty(\'' + item.id + '\',-1)">-</button>' +
                                '<span>' + item.quantity + '</span>' +
                                '<button onclick="window._cqty(\'' + item.id + '\',1)"' + plusDisabled + '>+</button>' +
                            '</div>' +
                            warn +
                        '</div>' +
                        '<div class="cart-item__price">' +
                            '<p class="cart-item__subtotal">' + cartModule.fmt(sub) + '</p>' +
                            '<p class="cart-item__unit">' + cartModule.fmt(item.price) + ' c/u</p>' +
                            '<button class="cart-item__remove" onclick="window._cremove(\'' + item.id + '\')">Eliminar</button>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
            '<div class="cart-summary" id="checkoutSummary">' +
                '<p class="cart-summary__title">Resumen del pedido</p>' +
                '<div class="cart-summary__row"><span>Subtotal</span><span>' + cartModule.fmt(subtotal) + '</span></div>' +
                '<div class="cart-summary__row">' + shippingLabel + '</div>' +
                ctaHtml +
                '<div class="cart-delivery"><i class="bi bi-truck"></i>Entrega estimada: <strong>' + (s.deliveryEstimate || '2 a 5 días hábiles') + '</strong></div>' +
                '<div class="cart-summary__divider"></div>' +
                '<div class="cart-summary__total"><span class="cart-summary__total-label">Total</span><span class="cart-summary__total-amount">' + cartModule.fmt(total) + '</span></div>' +
                '<div class="checkout-form" id="checkoutForm" autocomplete="on">' +
                    '<div class="pay-method" id="payMethod">' +
                        '<div class="pay-method__opt selected" data-method="mercadopago" onclick="window._qhSetPay(\'mercadopago\')">' +
                            '<input type="radio" name="payMethod" value="mercadopago" checked>' +
                            '<div><div class="pay-method__opt-title">Tarjeta de crédito / débito</div>' +
                            '<div class="pay-method__opt-sub">Pago seguro vía Mercado Pago</div></div>' +
                        '</div>' +
                        '<div class="pay-method__opt" data-method="transferencia" onclick="window._qhSetPay(\'transferencia\')">' +
                            '<input type="radio" name="payMethod" value="transferencia">' +
                            '<div><div class="pay-method__opt-title">Transferencia bancaria</div>' +
                            '<div class="pay-method__opt-sub">Depósito directo a nuestra cuenta</div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="transfer-info" id="transferInfo"></div>' +
                    '<p class="checkout-form__hint" id="autofillHint"><i class="bi bi-magic"></i> <a href="#" id="autofillBtn">Usar mis datos guardados</a></p>' +
                    '<div class="form-group" id="grpShipEmail"><label class="form-label" for="shipEmail">Correo electrónico *</label><input class="form-input" id="shipEmail" name="email" autocomplete="email" inputmode="email" placeholder="tu@correo.com"><p class="form-error">Escribe un correo válido para enviarte la confirmación de tu pedido</p></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" id="grpShipName"><label class="form-label" for="shipName">Nombre completo *</label><input class="form-input" id="shipName" name="name" autocomplete="name" placeholder="Tu nombre"><p class="form-error">Escribe tu nombre para el envío</p></div>' +
                        '<div class="form-group" id="grpShipPhone"><label class="form-label" for="shipPhone">Teléfono *</label><input class="form-input" id="shipPhone" name="tel" autocomplete="tel" placeholder="10 dígitos" type="tel" inputmode="tel" maxlength="10"><p class="form-error">El teléfono debe tener 10 dígitos. Solo lo usamos para coordinar tu entrega.</p></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" id="grpShipStreet"><label class="form-label" for="shipStreet">Calle y número *</label><input class="form-input" id="shipStreet" name="address-line1" autocomplete="shipping address-line1" placeholder="Av. Siempre Viva 742"><p class="form-error">Escribe la calle y número</p></div>' +
                        '<div class="form-group"><label class="form-label" for="shipColony">Colonia</label><input class="form-input" id="shipColony" name="address-line2" autocomplete="shipping address-line2" placeholder="Centro"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" id="grpShipCity"><label class="form-label" for="shipCity">Ciudad / Municipio *</label><input class="form-input" id="shipCity" name="locality" autocomplete="shipping locality" placeholder="Monterrey"><p class="form-error">Escribe tu ciudad o municipio</p></div>' +
                        '<div class="form-group"><label class="form-label" for="shipState">Estado</label><input class="form-input" id="shipState" name="region" autocomplete="shipping region" placeholder="Nuevo León"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label class="form-label" for="shipZip">Código postal</label><input class="form-input" id="shipZip" name="postal-code" autocomplete="shipping postal-code" placeholder="64000" inputmode="numeric" maxlength="5"><p class="form-error">El código postal debe tener 5 dígitos</p></div>' +
                        '<div class="form-group"><label class="form-label" for="shipNotes">Notas (opcional)</label><textarea class="form-textarea" id="shipNotes" placeholder="Referencias, edificio..." rows="1"></textarea></div>' +
                    '</div>' +
                    '<input type="hidden" name="country" autocomplete="shipping country-name" value="MX">' +
                    '<div class="age-check"><input type="checkbox" id="ageConfirm"><label for="ageConfirm" id="ageConfirmLabel">Confirmo que soy <strong>mayor de 18 años</strong>. Prohibida la venta de alcohol a menores.</label></div>' +
                    '<button class="btn-place-order" id="btnPlaceOrder" type="submit">Realizar pedido y pagar</button>' +
                    '<p class="checkout-note" id="checkoutNote"><i class="bi bi-shield-lock"></i> Pago seguro vía Mercado Pago. Puedes pagar con tarjeta.</p>' +
                '</div>' +
                '<div class="cart-trust">' +
                    '<p class="cart-trust__title">Métodos de pago</p>' +
                    '<div class="cart-trust__methods">' +
                        '<span class="pay-badge pay-badge--mp">Mercado Pago</span>' +
                        '<span class="pay-badge">VISA</span>' +
                        '<span class="pay-badge">Mastercard</span>' +
                        '<span class="pay-badge">AMEX</span>' +
                        '<span class="pay-badge">Transferencia</span>' +
                    '</div>' +
                    '<p class="cart-trust__note"><i class="bi bi-patch-check"></i> +18 · Hidromiel artesanal · Monterrey, NL</p>' +
                '</div>' +
            '</div>' +
        '</div>';

        document.getElementById('checkoutForm').addEventListener('submit', function (e) {
            e.preventDefault();
            placeOrder();
        });
        document.getElementById('autofillBtn').addEventListener('click', function (e) {
            e.preventDefault();
            autofillShipping(true);
        });
        document.getElementById('btnClearCart').addEventListener('click', function () {
            if (!confirm('¿Vaciar todo tu carrito?')) return;
            cartModule.clear();
            renderCart();
        });
        autofillShipping(false);
        renderTransferInfo();
        masks();
    }

    function masks() {
        var phone = document.getElementById('shipPhone');
        phone.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
        var zip = document.getElementById('shipZip');
        zip.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 5);
        });
    }

    function fillShipping(data, force) {
        if (!data) return;
        var map = { name: 'shipName', email: 'shipEmail', phone: 'shipPhone', street: 'shipStreet', colony: 'shipColony', city: 'shipCity', state: 'shipState', zip: 'shipZip' };
        Object.keys(map).forEach(function (k) {
            var el = document.getElementById(map[k]);
            if (el && data[k] && (force || !el.value)) el.value = data[k];
        });
        if (data.address && !data.street) {
            var s = document.getElementById('shipStreet');
            if (s && (force || !s.value)) s.value = data.address;
        }
        var hint = document.getElementById('autofillHint');
        if (hint) {
            var any = Object.keys(map).some(function (k) {
                var el = document.getElementById(map[k]);
                return el && el.value;
            });
            hint.style.display = any ? 'flex' : 'none';
        }
    }

    async function autofillShipping(force) {
        var saved = loadShippingData();
        if (saved.name || saved.email || saved.phone || saved.street || saved.colony || saved.city || saved.zip || saved.address) {
            fillShipping(saved, force);
            return;
        }
        try {
            var session = await sb.auth.getSession();
            var user = session.data.session ? session.data.session.user : null;
            if (!user) return;
            var data = { name: (user.user_metadata && user.user_metadata.full_name) || '', email: user.email || '' };
            var { data: sub } = await sb.from('subscriptions')
                .select('shipping_phone,shipping_address,shipping_municipality')
                .eq('user_id', user.id).eq('status', 'active')
                .order('created_at', { ascending: false }).limit(1).maybeSingle();
            if (sub) {
                data.phone = sub.shipping_phone || '';
                data.street = sub.shipping_address || '';
                data.city = sub.shipping_municipality || '';
            }
            if (!data.phone || !data.street) {
                var { data: order } = await sb.from('orders')
                    .select('shipping_name,shipping_phone,shipping_address')
                    .eq('user_id', user.id)
                    .not('shipping_address', 'is', null)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle();
                if (order) {
                    if (!data.name) data.name = order.shipping_name || '';
                    if (!data.phone) data.phone = order.shipping_phone || '';
                    if (!data.street) data.street = order.shipping_address || '';
                }
            }
            fillShipping(data, force);
        } catch (e) {}
    }

    window._cqty = function (id, delta) {
        var item = cartModule.items().filter(function (i) { return String(i.id) === String(id); })[0];
        if (!item) return;
        var nq = item.quantity + delta;
        if (nq < 1) { cartModule.remove(id); renderCart(); return; }
        if (nq > maxFor(item)) { showToast('Solo puedes pedir ' + maxFor(item) + ' de este producto', 'err'); return; }
        cartModule.setQty(id, nq);
        renderCart();
    };
    window._cremove = function (id) {
        if (cartModule.remove(id)) {
            renderCart();
            showUndoToast('Producto eliminado', function () {
                cartModule.restoreLastRemoved();
                renderCart();
            });
        }
    };

    function setInvalid(grpId, invalid) {
        var grp = document.getElementById(grpId);
        if (grp) grp.classList.toggle('invalid', invalid);
        return invalid;
    }

    function validateForm() {
        var name = document.getElementById('shipName').value.trim();
        var email = document.getElementById('shipEmail').value.trim();
        var phone = document.getElementById('shipPhone').value.replace(/\D/g, '');
        var street = document.getElementById('shipStreet').value.trim();
        var city = document.getElementById('shipCity').value.trim();
        var zip = document.getElementById('shipZip').value.trim();
        var age = document.getElementById('ageConfirm').checked;
        var ok = true;
        ok = setInvalid('grpShipName', !name) && ok;
        ok = setInvalid('grpShipEmail', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) && ok;
        ok = setInvalid('grpShipPhone', phone.length !== 10) && ok;
        ok = setInvalid('grpShipStreet', !street) && ok;
        ok = setInvalid('grpShipCity', !city) && ok;
        if (zip && !/^\d{5}$/.test(zip)) ok = setInvalid('grpShipZip', true) && ok;
        var ageGrp = document.getElementById('ageConfirmLabel');
        if (!age) {
            if (ageGrp) ageGrp.style.color = 'var(--red)';
            ok = false;
        } else if (ageGrp) {
            ageGrp.style.color = '';
        }
        return ok;
    }

    async function placeOrder() {
        if (!validateForm()) {
            showToast('Revisa los campos marcados', 'err');
            var first = document.querySelector('.form-group.invalid .form-input');
            if (first) first.focus();
            return;
        }

        var btn = document.getElementById('btnPlaceOrder');
        var shipEmail = document.getElementById('shipEmail').value.trim();
        var shipName = document.getElementById('shipName').value.trim();
        var shipPhone = document.getElementById('shipPhone').value.trim();
        var shipStreet = document.getElementById('shipStreet').value.trim();
        var shipColony = document.getElementById('shipColony').value.trim();
        var shipCity = document.getElementById('shipCity').value.trim();
        var shipState = document.getElementById('shipState').value.trim();
        var shipZip = document.getElementById('shipZip').value.trim();
        var shipNotes = document.getElementById('shipNotes').value.trim();
        var shipAddress = [shipStreet, shipColony, shipCity, shipState, shipZip ? 'CP ' + shipZip : ''].filter(Boolean).join(', ');

        saveShippingData({ name: shipName, email: shipEmail, phone: shipPhone, street: shipStreet, colony: shipColony, city: shipCity, state: shipState, zip: shipZip });

        btn.disabled = true;
        btn.textContent = 'Creando tu pedido...';

        var payMethod = (document.querySelector('input[name="payMethod"]:checked') || {}).value || 'mercadopago';

        try {
            var { data, error } = await sb.functions.invoke('create-order', {
                body: {
                    items: cartModule.items().map(function (i) { return { product_id: i.id, quantity: i.quantity }; }),
                    shipping: { name: shipName, email: shipEmail, phone: shipPhone, address: shipAddress, notes: shipNotes },
                    back_url: backUrl,
                    payment_method: payMethod
                }
            });
            if (error) throw error;
            if (!data.ok) {
                if (data.code === 'out_of_stock' || data.error === 'stock') {
                    var details = (data.details || []).slice(0, 3);
                    details.forEach(function (d) { showToast(d, 'err'); });
                    var removed = await cartModule.validate();
                    removed.forEach(function (m) { showToast(m, 'err'); });
                    renderCart();
                    btn.disabled = false;
                    btn.textContent = 'Realizar pedido y pagar';
                    return;
                }
                throw new Error(data.error || 'No se pudo crear el pedido');
            }

            if (data.payment_method === 'transferencia') {
                sessionStorage.setItem('qh_order_id', data.order_id);
                cartModule.clear();
                finishTransfer(data.order_id, data.bank, data.total);
                return;
            }

            sessionStorage.setItem('qh_order_id', data.order_id);
            localStorage.setItem('qh_cart_backup', localStorage.getItem('qh_cart') || '{"items":[]}');
            window.location.href = data.init_point;
        } catch (e) {
            showToast('Error: ' + e.message, 'err');
            btn.disabled = false;
            btn.textContent = 'Realizar pedido y pagar';
        }
    }

    /* ================= Init ================= */
    cartModule.init();
    loadBankInfo();
    cartModule.validate().then(function (notices) {
        notices.forEach(function (m) { showToast(m, 'err'); });
        if (showPaymentResult()) return;
        renderCart();
    });
    window.addEventListener('qh:cart:change', function () {
        if (new URLSearchParams(window.location.search).get('payment')) return;
        renderCart();
    });
});
