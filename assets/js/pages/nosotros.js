document.addEventListener('DOMContentLoaded', function () {
    var qh = window.QH;
    var sb = qh && qh.sb;
    var slider = document.getElementById('communitySlider');
    var track = document.getElementById('communitySliderTrack');
    var dots = document.getElementById('communitySliderDots');
    var empty = document.getElementById('communitySliderEmpty');
    var timerBar = document.getElementById('communitySliderTimer');
    var state = { slides: [], index: 0, interval: null, paused: false };

    function tr(key, fallback, params) {
        return qh && qh.i18n && qh.i18n.t ? qh.i18n.t(key, params) : (fallback || key);
    }

    function renderNosotrosTitle(value) {
        var title = document.getElementById('nosTitle');
        if (!title) return;
        var source = document.createElement('template');
        source.innerHTML = qh.normalizeEditableText(value || '');
        var text = source.content.textContent.replace(/<[^>]*>/g, '').trim();
        var accent = 'a tu fiesta';
        var accentIndex = text.toLowerCase().lastIndexOf(accent);
        title.textContent = '';
        if (accentIndex < 1) {
            title.textContent = text;
            return;
        }
        title.appendChild(document.createTextNode(text.slice(0, accentIndex)));
        var accentNode = document.createElement('em');
        accentNode.className = 'accent--rasp';
        accentNode.textContent = text.slice(accentIndex);
        title.appendChild(accentNode);
    }

    function loadContent() {
        if (!sb) return;
        sb.from('site_content').select('*').eq('section', 'nosotros').then(function (r) {
            if (!r.data) return;
            var m = {};
            r.data.forEach(function (c) { m[c.key] = c.value; });
            if (m.nosotros_title) renderNosotrosTitle(m.nosotros_title);
            if (m.nosotros_sub) qh.setEditableText(document.getElementById('nosSub'), m.nosotros_sub, 'nosotros_sub');
            if (m.nosotros_text) qh.renderEditableRichText(document.getElementById('nosText'), m.nosotros_text);
        });
    }

    function stopAutoplay() {
        if (state.interval) window.clearInterval(state.interval);
        state.interval = null;
        if (timerBar) timerBar.classList.remove('is-running');
    }

    function restartProgress() {
        if (!timerBar) return;
        timerBar.classList.remove('is-running', 'is-paused');
        void timerBar.offsetWidth;
        if (state.paused) {
            timerBar.classList.add('is-paused');
        } else {
            timerBar.classList.add('is-running');
        }
    }

    function startAutoplay() {
        stopAutoplay();
        if (state.paused || state.slides.length < 2) return;
        state.interval = window.setInterval(function () { setActive(state.index + 1, false); }, 2000);
        restartProgress();
    }

    function setActive(index, restart) {
        if (!state.slides.length) return;
        state.index = (index + state.slides.length) % state.slides.length;
        var slideEls = track.querySelectorAll('.community-slider__slide');
        var dotEls = dots.querySelectorAll('.community-slider__dot');
        Array.prototype.forEach.call(slideEls, function (el, i) {
            var active = i === state.index;
            el.classList.toggle('is-active', active);
            el.setAttribute('aria-hidden', active ? 'false' : 'true');
            var video = el.querySelector('video');
            if (!video) return;
            if (active) {
                var play = video.play();
                if (play && play.catch) play.catch(function () {});
            } else {
                video.pause();
            }
        });
        Array.prototype.forEach.call(dotEls, function (el, i) {
            var active = i === state.index;
            el.classList.toggle('is-active', active);
            el.setAttribute('aria-current', active ? 'true' : 'false');
        });
        if (restart !== false && !state.paused) startAutoplay();
        else restartProgress();
    }

    function showEmpty() {
        if (slider) slider.classList.add('community-slider--empty');
        if (empty) empty.hidden = false;
        stopAutoplay();
    }

    function renderSlider(items) {
        state.slides = items || [];
        state.index = 0;
        if (!state.slides.length) {
            showEmpty();
            return;
        }
        if (slider) slider.classList.remove('community-slider--empty');
        if (empty) empty.hidden = true;
        track.innerHTML = '';
        dots.innerHTML = '';

        state.slides.forEach(function (item, index) {
            var slide = document.createElement('article');
            slide.className = 'community-slider__slide';
            slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

            var alt = qh ? qh.normalizeEditableText(item.alt || '') : String(item.alt || '');
            var media;
            if (item.media_type === 'video') {
                media = document.createElement('video');
                media.muted = true;
                media.autoplay = index === 0;
                media.loop = true;
                media.playsInline = true;
                media.preload = 'metadata';
                media.setAttribute('aria-label', alt || tr('about.videoAlt', 'Video de la comunidad Queens'));
                media.setAttribute('muted', '');
            } else {
                media = document.createElement('img');
                media.alt = alt || tr('about.communityAlt', 'Comunidad Queens brindando');
                media.loading = index === 0 ? 'eager' : 'lazy';
            }
            media.src = item.media_url;
            slide.appendChild(media);

            var veil = document.createElement('span');
            veil.className = 'community-slider__veil';
            veil.setAttribute('aria-hidden', 'true');
            slide.appendChild(veil);

            var caption = document.createElement('div');
            caption.className = 'community-slider__caption';
            var eyebrow = document.createElement('span');
            eyebrow.className = 'community-slider__eyebrow';
            eyebrow.textContent = item.media_type === 'video' ? tr('about.movingTribe', 'La experiencia en movimiento') : tr('about.tribe', 'La experiencia Queens');
            var title = document.createElement('strong');
            title.textContent = tr('about.toastTitle', 'Un brindis que se antoja');
            caption.appendChild(eyebrow);
            caption.appendChild(title);
            slide.appendChild(caption);
            track.appendChild(slide);

            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'community-slider__dot' + (index === 0 ? ' is-active' : '');
            dot.setAttribute('aria-label', tr('common.content', 'Ir al contenido {value}', { value: index + 1 }));
            dot.setAttribute('aria-current', index === 0 ? 'true' : 'false');
            dot.addEventListener('click', function () { setActive(index, true); });
            dots.appendChild(dot);
        });

        setActive(0, false);
        startAutoplay();
    }

    function loadGallery() {
        if (!sb) {
            showEmpty();
            return;
        }
        sb.from('nosotros_gallery')
            .select('id,media_url,media_type,alt,sort_order,created_at')
            .eq('active', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
            .then(function (r) {
                if (r.error) {
                    showEmpty();
                    return;
                }
                renderSlider(r.data || []);
            });
    }

    function initControls() {
        var prev = document.getElementById('communitySliderPrev');
        var next = document.getElementById('communitySliderNext');
        var pause = document.getElementById('communitySliderPause');
        if (prev) prev.addEventListener('click', function () { setActive(state.index - 1, true); });
        if (next) next.addEventListener('click', function () { setActive(state.index + 1, true); });
        if (pause) pause.addEventListener('click', function () {
            state.paused = !state.paused;
            pause.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
            pause.querySelector('i').className = state.paused ? 'bi bi-play-fill' : 'bi bi-pause-fill';
            pause.querySelector('span').textContent = state.paused ? tr('about.resume', 'Reanudar') : tr('about.pause', 'Pausar');
            if (state.paused) stopAutoplay();
            else startAutoplay();
        });
        if (slider) slider.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(state.index - 1, true); }
            if (e.key === 'ArrowRight') { e.preventDefault(); setActive(state.index + 1, true); }
        });
    }

    function initFaqs() {
        document.querySelectorAll('.faq__q').forEach(function (question) {
            question.setAttribute('role', 'button');
            question.setAttribute('tabindex', '0');
            function toggle() {
                var item = question.parentElement;
                item.classList.toggle('open');
                question.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
            }
            question.addEventListener('click', toggle);
            question.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });
    }

    loadContent();
    initControls();
    initFaqs();
    loadGallery();
});
