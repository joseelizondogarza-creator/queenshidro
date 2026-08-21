document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var supabase = window.QH.sb;

    var form = document.getElementById('adminLoginForm');
    var emailEl = document.getElementById('adminEmail');
    var passwordEl = document.getElementById('adminPassword');
    var rememberEl = document.getElementById('rememberMe');
    var errorEl = document.getElementById('error');
    var btn = document.getElementById('adminLoginSubmit');

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }

    function hideError() {
        errorEl.style.display = 'none';
    }

    rememberEl.checked = !!(window.QH.remember);
    var savedEmail = window.QH.getRememberEmail && window.QH.getRememberEmail();
    if (savedEmail) emailEl.value = savedEmail;

    async function goIfAdmin(user) {
        var profileResult = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profileResult.data && profileResult.data.role === 'admin') {
            window.location.replace('admin.html');
            return true;
        }
        return false;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError();
        var email = emailEl.value.trim();
        var password = passwordEl.value;
        btn.disabled = true;
        btn.textContent = 'Verificando...';

        if (window.QH.setRemember) window.QH.setRemember(rememberEl.checked);
        if (window.QH.saveRememberEmail) window.QH.saveRememberEmail(rememberEl.checked ? email : null);

        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });

        btn.disabled = false;
        btn.textContent = 'Entrar al panel';

        if (error) {
            showError(error.message === 'Invalid login credentials'
                ? 'Correo o contraseña incorrectos.'
                : error.message);
            return;
        }

        if (data.user) {
            var isAdmin = await goIfAdmin(data.user);
            if (!isAdmin) {
                await supabase.auth.signOut();
                showError('No tienes acceso de administrador con esta cuenta.');
            }
        }
    });

    supabase.auth.getSession().then(async function (result) {
        if (result.data.session && result.data.session.user) {
            var isAdmin = await goIfAdmin(result.data.session.user);
            if (!isAdmin) {
                await supabase.auth.signOut();
            }
        }
    });
});
