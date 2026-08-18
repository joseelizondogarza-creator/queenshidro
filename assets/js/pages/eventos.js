document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var sb = window.QH.sb;

    sb.from('site_content').select('*').eq('section', 'eventos').then(function (r) {
        if (!r.data) return;
        var m = {};
        r.data.forEach(function (c) { m[c.key] = c.value; });
        if (m.eventos_sub) document.getElementById('eventosSub').textContent = m.eventos_sub;
    });
});
