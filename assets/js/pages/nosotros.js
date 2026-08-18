document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var sb = window.QH.sb;

    sb.from('site_content').select('*').eq('section', 'nosotros').then(function (r) {
        if (!r.data) return;
        var m = {};
        r.data.forEach(function (c) { m[c.key] = c.value; });
        if (m.nosotros_title) document.getElementById('nosTitle').textContent = m.nosotros_title;
        if (m.nosotros_sub) document.getElementById('nosSub').textContent = m.nosotros_sub;
        if (m.nosotros_text) document.getElementById('nosText').innerHTML = m.nosotros_text;
    });
});
