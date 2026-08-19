(function () {
    function initServicesSlider() {
        var root = document.getElementById('servicesSlider');
        if (!root) return;

        var slides = Array.prototype.slice.call(root.querySelectorAll('.services-slide'));
        var tabs = Array.prototype.slice.call(root.querySelectorAll('.services-slider__tab'));
        var previous = document.getElementById('servicesPrev');
        var next = document.getElementById('servicesNext');
        var pause = document.getElementById('servicesPause');
        var current = document.getElementById('servicesCurrent');
        var total = document.getElementById('servicesTotal');
        var progress = document.getElementById('servicesProgress');
        var state = { index: 0, timer: null, paused: false, touchX: 0 };
        var duration = 6800;
        var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function syncPauseButton() {
            if (!pause) return;
            pause.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
            var icon = pause.querySelector('i');
            var label = pause.querySelector('span');
            if (icon) icon.className = state.paused ? 'bi bi-play-fill' : 'bi bi-pause-fill';
            if (label) label.textContent = state.paused ? 'Reanudar' : 'Pausar';
        }

        function resetProgress() {
            if (!progress) return;
            progress.classList.remove('is-running');
            void progress.offsetWidth;
            if (!state.paused) progress.classList.add('is-running');
        }

        function stopAutoplay() {
            if (state.timer) window.clearTimeout(state.timer);
            state.timer = null;
            if (progress) progress.classList.remove('is-running');
        }

        function startAutoplay() {
            stopAutoplay();
            resetProgress();
            if (state.paused || slides.length < 2) return;
            state.timer = window.setTimeout(function () {
                setActive(state.index + 1, true);
            }, duration);
        }

        function setActive(index, restart) {
            if (!slides.length) return;
            state.index = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                var active = slideIndex === state.index;
                slide.classList.toggle('is-active', active);
                slide.setAttribute('aria-hidden', active ? 'false' : 'true');
            });

            tabs.forEach(function (tab, tabIndex) {
                var active = tabIndex === state.index;
                tab.classList.toggle('is-active', active);
                tab.setAttribute('aria-selected', active ? 'true' : 'false');
                tab.setAttribute('tabindex', active ? '0' : '-1');
            });

            if (current) current.textContent = String(state.index + 1).padStart(2, '0');
            if (total) total.textContent = String(slides.length).padStart(2, '0');
            if (restart !== false) startAutoplay();
            else resetProgress();
        }

        function togglePause() {
            state.paused = !state.paused;
            syncPauseButton();
            if (state.paused) stopAutoplay();
            else startAutoplay();
        }

        tabs.forEach(function (tab, index) {
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
            tab.addEventListener('click', function () { setActive(index, true); });
            tab.addEventListener('keydown', function (event) {
                var targetIndex = index;
                if (event.key === 'ArrowLeft') targetIndex = index - 1;
                if (event.key === 'ArrowRight') targetIndex = index + 1;
                if (event.key === 'Home') targetIndex = 0;
                if (event.key === 'End') targetIndex = tabs.length - 1;
                if (targetIndex === index) return;
                event.preventDefault();
                event.stopPropagation();
                setActive(targetIndex, true);
                tabs[(targetIndex + tabs.length) % tabs.length].focus();
            });
        });
        if (previous) previous.addEventListener('click', function () { setActive(state.index - 1, true); });
        if (next) next.addEventListener('click', function () { setActive(state.index + 1, true); });
        if (pause) pause.addEventListener('click', togglePause);

        root.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                setActive(state.index - 1, true);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                setActive(state.index + 1, true);
            }
            if (event.key === 'Home') {
                event.preventDefault();
                setActive(0, true);
            }
            if (event.key === 'End') {
                event.preventDefault();
                setActive(slides.length - 1, true);
            }
            if (event.key === ' ' || event.key === 'Enter') {
                if (event.target === root) {
                    event.preventDefault();
                    togglePause();
                }
            }
        });

        root.addEventListener('touchstart', function (event) {
            state.touchX = event.changedTouches[0].clientX;
        }, { passive: true });
        root.addEventListener('touchend', function (event) {
            var distance = event.changedTouches[0].clientX - state.touchX;
            if (Math.abs(distance) < 45) return;
            setActive(state.index + (distance < 0 ? 1 : -1), true);
        }, { passive: true });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stopAutoplay();
            else if (!state.paused) startAutoplay();
        });

        if (reducedMotion) state.paused = true;
        syncPauseButton();
        setActive(0, false);
        if (!state.paused) startAutoplay();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initServicesSlider);
    } else {
        initServicesSlider();
    }
}());
