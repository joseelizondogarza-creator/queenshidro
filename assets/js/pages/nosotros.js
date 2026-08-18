document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var sb = window.QH.sb;

    sb.from('site_content').select('*').eq('section', 'nosotros').then(function (r) {
        if (!r.data) return;
        var m = {};
        r.data.forEach(function (c) { m[c.key] = c.value; });
        if (m.nosotros_title) window.QH.setEditableText(document.getElementById('nosTitle'), m.nosotros_title);
        if (m.nosotros_sub) window.QH.setEditableText(document.getElementById('nosSub'), m.nosotros_sub);
        if (m.nosotros_text) window.QH.renderEditableRichText(document.getElementById('nosText'), m.nosotros_text);
    });
});
