document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var supabase = window.QH.sb;

    var loading = document.getElementById('loading');
    var profileContent = document.getElementById('profileContent');

    function formatDate(d) {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function loadProfile(user) {
        loading.style.display = 'none';
        profileContent.style.display = 'block';

        var name = (user.user_metadata && user.user_metadata.full_name) || user.email.split('@')[0];
        document.getElementById('profAvatar').textContent = name.charAt(0).toUpperCase();
        document.getElementById('profName').textContent = name;
        document.getElementById('profEmail').textContent = user.email;
        document.getElementById('profCreated').textContent = formatDate(user.created_at);
        document.getElementById('profLastSignIn').textContent = formatDate(user.last_sign_in_at);
        document.getElementById('profVerified').textContent = user.email_confirmed_at ? 'Sí' : 'No';

        loadSubscription(user.id);
    }

    async function loadSubPricingConfig() {
        var m = {};
        var { data, error } = await supabase.from('site_content').select('key,value').eq('section', 'suscripcion');
        (data || []).forEach(function (c) { m[c.key] = c.value; });
        var num = function (k, d) { var n = parseFloat(m[k]); return isNaN(n) ? d : n; };
        return {
            regular: num('regular_bottle_price', 80),
            recurring: num('recurring_discount', 5),
            prepaid2m: num('prepaid_2m', 6),
            prepaid3m: num('prepaid_3m', 8),
            prepaid6m: num('prepaid_6m', 12),
            prepaid12m: num('prepaid_12m', 15),
        };
    }

    async function loadSubscription(userId) {
        var card = document.getElementById('subCard');
        var { data, error } = await supabase.from('subscriptions').select('*,subscription_plans(name,bottle_count,price,price_per_bottle,shipping_flat)').eq('user_id', userId).maybeSingle();
        if (error || !data || data.status === 'cancelled') {
            card.innerHTML = '<div class="sub-card__empty">' +
                '<p>No tienes una suscripción activa.</p>' +
                '<a href="membresia.html" class="sub-card__btn sub-card__btn--gold">Ver suscripciones</a>' +
            '</div>';
            return;
        }
        var p = data.subscription_plans || {};
        var isRecurring = data.billing_type === 'recurring';
        var perBottle = p.price_per_bottle || 65;
        var ship = p.shipping_flat || 150;
        var duration = data.duration_months || 2;
        var totalPaid = data.total_paid || 0;
        var cfg = await loadSubPricingConfig();
        var DURATION_TIERS = [
            { months: 2, discount: cfg.prepaid2m },
            { months: 3, discount: cfg.prepaid3m },
            { months: 6, discount: cfg.prepaid6m },
            { months: 12, discount: cfg.prepaid12m },
        ];
        var tier = DURATION_TIERS.find(function (t) { return t.months === duration; }) || DURATION_TIERS[0];
        var shownPerBottle = isRecurring ? perBottle * (1 - cfg.recurring / 100) : perBottle * (1 - tier.discount / 100);
        var savingPerBottle = cfg.regular - shownPerBottle;
        var savingPct = Math.round((savingPerBottle / cfg.regular) * 100);
        var totalSaving = p.bottle_count * savingPerBottle;
        card.innerHTML = '<p class="sub-card__title">Tu suscripción</p>' +
            '<div class="sub-card__plan">' +
                '<div class="sub-card__plan-icon"><i class="bi bi-cup-straw"></i></div>' +
                '<div>' +
                    '<p class="sub-card__plan-name">' + p.name + '</p>' +
                    '<p class="sub-card__plan-detail">' + p.bottle_count + ' botellas/mes · ' + (isRecurring ? 'mensual renovable' : duration + ' meses') + ' · $' + shownPerBottle.toFixed(2) + ' c/botella</p>' +
                '</div>' +
            '</div>' +
            '<div class="sub-card__rows">' +
                '<div class="sub-card__row"><span class="sub-card__label">Estado</span><span class="sub-card__badge sub-card__badge--' + data.status + '">' + data.status + '</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">Modalidad</span><span class="sub-card__badge ' + (isRecurring ? 'sub-card__badge--active' : '') + '">' + (isRecurring ? 'MENSUAL · RENOVABLE' : 'PREPAGO') + '</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">Duración</span><span class="sub-card__value">' + (isRecurring ? 'Mes a mes · cancela cuando quieras' : duration + ' meses') + '</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">' + (isRecurring ? 'Cargo mensual' : 'Total pagado') + '</span><span class="sub-card__value" style="color:var(--gold-hi);font-weight:700">$' + parseFloat(totalPaid).toFixed(2) + ' MXN' + (isRecurring ? '/mes' : '') + '</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">Ahorro</span><span class="sub-card__value" style="color:var(--green)">$' + totalSaving.toFixed(2) + '/mes (' + savingPct + '% vs sin suscripción)</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">Entrega en</span><span class="sub-card__value">' + data.shipping_municipality + '</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">Dirección</span><span class="sub-card__value">' + data.shipping_address + '</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">' + (isRecurring ? 'Siguiente cargo' : 'Compromiso hasta') + '</span><span class="sub-card__value">' + formatDate(data.current_period_end) + '</span></div>' +
                '<div class="sub-card__row"><span class="sub-card__label">Teléfono</span><span class="sub-card__value">' + data.shipping_phone + '</span></div>' +
            '</div>' +
            '<div class="sub-card__actions">' +
                '<button class="sub-card__btn sub-card__btn--danger" onclick="cancelMySub(\'' + data.id + '\')">Cancelar suscripción</button>' +
            '</div>';
    }

    window.cancelMySub = async function (id) {
        if (!confirm('¿Cancelar tu suscripción? Se cancelará y no se harán más cobros.')) return;
        var { data, error } = await supabase.functions.invoke('cancel-subscription', { body: { subscription_id: id } });
        if (error || (data && !data.ok)) { alert('Error: ' + ((data && data.error) || error.message)); return; }
        location.reload();
    };

    document.getElementById('logoutBtn').addEventListener('click', async function () {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    supabase.auth.getSession().then(function (result) {
        if (result.data.session && result.data.session.user) {
            loadProfile(result.data.session.user);
        } else {
            window.location.href = 'login.html';
        }
    });

    supabase.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    });
});
