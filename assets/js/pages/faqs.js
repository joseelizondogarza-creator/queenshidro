document.addEventListener('DOMContentLoaded', function () {
    if (!window.QH || !window.QH.sb) return;
    var sb = window.QH.sb;

    sb.from('site_content').select('*').eq('section', 'faqs').then(function (r) {
        if (!r.data) return;
        var m = {};
        r.data.forEach(function (c) { m[c.key] = c.value; });
        if (m.faqs_sub) window.QH.setEditableText(document.getElementById('faqsSub'), m.faqs_sub);
        if (m.faqs_sabor) window.QH.setEditableText(document.getElementById('faqsSabor'), m.faqs_sabor);
        if (m.faqs_miel) window.QH.setEditableText(document.getElementById('faqsMiel'), m.faqs_miel);
        if (m.faqs_membresia) window.QH.setEditableText(document.getElementById('faqsMembresia'), m.faqs_membresia);
        if (m.faqs_vegano) window.QH.setEditableText(document.getElementById('faqsVegano'), m.faqs_vegano);
        if (m.faqs_cta) window.QH.setEditableText(document.getElementById('faqsCta'), m.faqs_cta);
    });

    document.querySelectorAll('.faq-item__q').forEach(function (q) {
        q.addEventListener('click', function () {
            var item = q.parentElement;
            var wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
            if (!wasOpen) item.classList.add('open');
        });
    });
});
