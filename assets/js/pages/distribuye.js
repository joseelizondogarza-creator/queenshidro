document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var sb = window.QH.sb;

    var leadType = 'botella';
    var hints = {
        botella: 'Botellas — desde 12 unidades, precio por volumen y envío a todo México.',
        barril: 'Barril — kegs para bar y restaurante, plan de reposición según tu consumo.'
    };
    var hintEl = document.getElementById('distHint');
    var toggleBtns = document.querySelectorAll('.dist__toggle-btn');
    toggleBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            toggleBtns.forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on');
            leadType = b.getAttribute('data-type') || 'botella';
            if (hintEl) window.QH.setEditableText(hintEl, hints[leadType] || '');
        });
    });

    var textKeys = {
        distTag: 'distTag', distTitle: 'distTitle', distSub: 'distSub',
        distText: 'distText', distBtn: 'ldSubmit',
        distHintBottle: 'distHintBottle', distHintBarrel: 'distHintBarrel',
        distFeat1Title: 'distFeat1Title', distFeat1Desc: 'distFeat1Desc',
        distFeat2Title: 'distFeat2Title', distFeat2Desc: 'distFeat2Desc',
        distFeat3Title: 'distFeat3Title', distFeat3Desc: 'distFeat3Desc',
        distContactTitle: 'distContactTitle', distContactSub: 'distContactSub'
    };
    var textIds = Object.keys(textKeys);
    sb.from('site_content').select('key,value').in('key', textIds).then(function (r) {
        if (!r.data) return;
        r.data.forEach(function (c) {
            if (c.key === 'distHintBottle' && c.value) hints.botella = c.value;
            if (c.key === 'distHintBarrel' && c.value) hints.barril = c.value;
            var elId = textKeys[c.key];
            if (!elId) return;
            var el = document.getElementById(elId);
            if (el && c.value) window.QH.setEditableText(el, c.value);
        });
        if (hintEl) window.QH.setEditableText(hintEl, hints[leadType] || '');
    });

    document.getElementById('distForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn = document.getElementById('ldSubmit');
        var btnLabel = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        var data = {
            full_name: document.getElementById('ldName').value.trim(),
            email: document.getElementById('ldEmail').value.trim(),
            phone: document.getElementById('ldPhone').value.trim(),
            company: document.getElementById('ldCompany').value.trim(),
            source: 'distribuye',
            status: 'nuevo',
            lead_type: leadType,
            notes: document.getElementById('ldMessage').value.trim()
        };
        if (!data.full_name) {
            btn.disabled = false;
            btn.textContent = btnLabel;
            return;
        }
        var { data: res, error } = await sb.functions.invoke('submit-lead', { body: data });
        if (error || (res && !res.ok)) {
            btn.disabled = false;
            btn.textContent = btnLabel;
            return;
        }
        document.getElementById('distForm').reset();
        var ok = document.getElementById('ldSuccess');
        ok.hidden = false;
        btn.textContent = 'Enviado';
        setTimeout(function () {
            ok.hidden = true;
            btn.disabled = false;
            btn.textContent = btnLabel;
        }, 4000);
    });
});
