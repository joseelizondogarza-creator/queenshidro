document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var supabase = window.QH.sb;

    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');
    var dashboard = document.getElementById('dashboard');
    var errorEl = document.getElementById('error');
    var successEl = document.getElementById('success');
    var tabs = document.querySelectorAll('.auth-card__tab');
    var dashboardLoading = false;

    function tr(key, fallback, params) {
        return window.QH && window.QH.i18n && window.QH.i18n.t
            ? window.QH.i18n.t(key, params)
            : (fallback || key);
    }

    var navUser = document.getElementById('navUser');
    var userAvatar = document.getElementById('userAvatar');

    function getName(user) {
        return (user.user_metadata && user.user_metadata.full_name) || user.email.split('@')[0];
    }

    function updateNav(user) {
        if (!navUser || !userAvatar) return;
        var name = getName(user);
        navUser.style.display = 'block';
        userAvatar.textContent = name.charAt(0).toUpperCase();
        userAvatar.title = name;
        var cta = document.querySelector('.nav__cta');
        if (cta) cta.style.display = 'none';
    }

    function hideNav() {
        if (!navUser) return;
        navUser.style.display = 'none';
        var cta = document.querySelector('.nav__cta');
        if (cta) cta.style.display = '';
    }

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
    }

    function showSuccess(msg) {
        successEl.textContent = msg;
        successEl.style.display = 'block';
        errorEl.style.display = 'none';
    }

    function hideMessages() {
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
    }

    async function showDashboard(user) {
        if (dashboardLoading) return;
        dashboardLoading = true;

        var profileResult = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profileResult.data && profileResult.data.role === 'admin') {
            window.location.replace('admin.html');
            return;
        }

        dashboardLoading = false;
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        tabs.forEach(function (t) { t.style.display = 'none'; });
        dashboard.style.display = 'flex';
        updateNav(user);

        var name = getName(user);
        document.getElementById('dashName').textContent = name;
        document.getElementById('dashEmail').textContent = user.email;
        document.getElementById('dashAvatar').textContent = name.charAt(0).toUpperCase();
    }

    function showLoginForms() {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs.forEach(function (t) { t.style.display = ''; });
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        dashboard.style.display = 'none';
        hideNav();
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            hideMessages();
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var isLogin = tab.dataset.tab === 'login';
            loginForm.style.display = isLogin ? 'block' : 'none';
            registerForm.style.display = isLogin ? 'none' : 'block';
        });
    });

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideMessages();
        var email = document.getElementById('loginEmail').value.trim();
        var password = document.getElementById('loginPassword').value;
        var btn = document.getElementById('loginSubmit');
        btn.disabled = true;
        btn.textContent = tr('auth.loading', 'Ingresando...');

        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });

        btn.disabled = false;
        btn.textContent = tr('auth.enter', 'Entrar');

        if (error) {
            showError(error.message === 'Invalid login credentials'
                ? tr('auth.invalid', 'Correo o contraseña incorrectos.')
                : error.message);
        } else if (data.user) {
            showDashboard(data.user);
        }
    });

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideMessages();
        var name = document.getElementById('registerName').value.trim();
        var email = document.getElementById('registerEmail').value.trim();
        var password = document.getElementById('registerPassword').value;
        var btn = document.getElementById('registerSubmit');
        btn.disabled = true;
        btn.textContent = tr('auth.creating', 'Creando cuenta...');

        var { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: name } }
        });

        btn.disabled = false;
        btn.textContent = tr('auth.create', 'Crear cuenta');

        if (error) {
            showError(error.message);
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
            showError(tr('auth.exists', 'Ya existe una cuenta con este correo. Inicia sesión.'));
        } else {
            showSuccess(tr('auth.created', 'Cuenta creada. Revisa tu correo para confirmar tu email.'));
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', async function () {
        await supabase.auth.signOut();
    });

    supabase.auth.getSession().then(function (result) {
        if (result.data.session && result.data.session.user) {
            updateNav(result.data.session.user);
            showDashboard(result.data.session.user);
        } else {
            showLoginForms();
        }
    });

    supabase.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_IN' && session && session.user) {
            updateNav(session.user);
            showDashboard(session.user);
        } else if (event === 'SIGNED_OUT') {
            showLoginForms();
        }
    });
});
