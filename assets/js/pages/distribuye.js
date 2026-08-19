document.addEventListener('DOMContentLoaded', function () {
    var sb = window.QH && window.QH.sb;
    var leadType = 'botella';
    var route = 'local';
    var selectedDate = '';
    var minDate = addDays(getMexicoDate(), 7);
    var cursor = parseYmd(minDate);

    var hints = {
        botella: 'Botella — cuéntanos qué formato imaginas para tu negocio.',
        barril: 'Barril — cuéntanos cómo te gustaría servir Queens.'
    };

    var municipality = document.getElementById('ldMunicipality');
    var municipalityField = document.getElementById('distMunicipalityField');
    var nationalLocation = document.getElementById('distNationalLocation');
    var state = document.getElementById('ldState');
    var city = document.getElementById('ldCity');
    var form = document.getElementById('distForm');
    var formTitle = document.getElementById('distFormTitle');
    var formSub = document.getElementById('distFormSub');
    var submit = document.getElementById('ldSubmit');
    var hintEl = document.getElementById('distHint');
    var errorEl = document.getElementById('distError');
    var successEl = document.getElementById('ldSuccess');
    var dateInput = document.getElementById('ldDate');
    var calendarGrid = document.getElementById('distCalendarGrid');
    var calendarMonth = document.getElementById('distCalendarMonth');
    var calendarSelected = document.getElementById('distCalendarSelected');
    var calendarNote = document.getElementById('distCalendarNote');
    var calendarPrev = document.getElementById('distCalendarPrev');
    var calendarNext = document.getElementById('distCalendarNext');
    var calendarEl = document.querySelector('.dist__calendar');

    if (!form || !calendarGrid) return;

    function tr(key, fallback, params) {
        return window.QH && window.QH.i18n && window.QH.i18n.t
            ? window.QH.i18n.t(key, params)
            : (fallback || key);
    }

    function pad(n) { return String(n).padStart(2, '0'); }

    function getMexicoDate() {
        var parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Monterrey',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());
        var values = {};
        parts.forEach(function (part) { if (part.type !== 'literal') values[part.type] = part.value; });
        return values.year + '-' + values.month + '-' + values.day;
    }

    function parseYmd(value) {
        var parts = String(value).split('-').map(Number);
        return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }

    function addDays(value, days) {
        var parts = parseYmd(value);
        var date = new Date(Date.UTC(parts.year, parts.month, parts.day));
        date.setUTCDate(date.getUTCDate() + days);
        return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
    }

    function isValidYmd(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        var parts = parseYmd(value);
        var date = new Date(Date.UTC(parts.year, parts.month, parts.day));
        return date.getUTCFullYear() === parts.year && date.getUTCMonth() === parts.month && date.getUTCDate() === parts.day;
    }

    function monthKey(value) {
        return value.year * 12 + value.month;
    }

    function monthLabel(year, month) {
        return new Intl.DateTimeFormat(window.QH && window.QH.i18n ? window.QH.i18n.locale() : 'es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })
            .format(new Date(Date.UTC(year, month, 1)));
    }

    function dateLabel(value) {
        var parts = parseYmd(value);
        return new Intl.DateTimeFormat(window.QH && window.QH.i18n ? window.QH.i18n.locale() : 'es-MX', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
        }).format(new Date(Date.UTC(parts.year, parts.month, parts.day)));
    }

    function setText(element, value) {
        if (element && window.QH && window.QH.setEditableText) window.QH.setEditableText(element, value);
        else if (element) element.textContent = value;
    }

    function showError(message) {
        if (!errorEl) return;
        errorEl.textContent = message || '';
        errorEl.hidden = !message;
    }

    function renderCalendar() {
        if (!calendarMonth || !calendarGrid) return;
        var weekdays = tr('calendar.weekdays', 'L,M,M,J,V,S,D').split(',');
        document.querySelectorAll('.dist__calendar-week span').forEach(function (day, index) {
            day.textContent = weekdays[index] || '';
        });
        calendarMonth.textContent = monthLabel(cursor.year, cursor.month);
        calendarPrev.disabled = monthKey(cursor) <= monthKey(parseYmd(minDate));

        var firstDay = new Date(Date.UTC(cursor.year, cursor.month, 1)).getUTCDay();
        var mondayOffset = (firstDay + 6) % 7;
        var daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
        var html = '';

        for (var i = 0; i < 42; i++) {
            var day = i - mondayOffset + 1;
            if (day < 1 || day > daysInMonth) {
                html += '<span class="dist__calendar-day is-muted" aria-hidden="true"></span>';
                continue;
            }
            var date = cursor.year + '-' + pad(cursor.month + 1) + '-' + pad(day);
            var disabled = date < minDate;
            var classes = 'dist__calendar-day';
            if (date === getMexicoDate()) classes += ' is-today';
            if (date === selectedDate) classes += ' is-selected';
            html += '<button type="button" class="' + classes + '" data-date="' + date + '"' +
                (disabled ? ' disabled' : '') + ' aria-label="' + dateLabel(date) + '">' + day + '</button>';
        }
        calendarGrid.innerHTML = html;
        calendarSelected.textContent = selectedDate
            ? tr('dist.selectedDate', 'Fecha tentativa: {date}', { date: dateLabel(selectedDate) })
            : tr('dist.noDate', 'Aún no has elegido una fecha.');
    }

    function updateRoute() {
        var isLocal = route === 'local';
        var routeButtons = document.querySelectorAll('.dist__route');
        routeButtons.forEach(function (button) {
            var active = button.getAttribute('data-route') === route;
            button.classList.toggle('on', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        if (calendarEl) {
            calendarEl.hidden = !isLocal;
            calendarEl.setAttribute('aria-hidden', isLocal ? 'false' : 'true');
        }
        if (!isLocal) {
            selectedDate = '';
            dateInput.value = '';
        }

        municipalityField.hidden = !isLocal;
        municipality.disabled = !isLocal;
        municipality.required = isLocal;
        nationalLocation.hidden = isLocal;
        state.disabled = isLocal;
        city.disabled = isLocal;
        state.required = !isLocal;
        city.required = !isLocal;

        formTitle.textContent = isLocal ? tr('dist.business', 'Cuéntanos de tu negocio') : tr('dist.nationalRequest', 'Solicita tu degustación');
        formSub.textContent = isLocal
            ? tr('dist.businessSub', 'Necesitamos estos datos para revisar la visita y entender qué estás buscando.')
            : tr('dist.nationalSub', 'Primero recibimos tu solicitud. Revisaremos el caso y te contactaremos para confirmar el siguiente paso.');
        submit.textContent = isLocal ? tr('dist.requestVisit', 'Solicitar visita') : tr('dist.requestTasting', 'Solicitar degustación');
        calendarNote.textContent = isLocal
            ? tr('dist.calendarNoteLocal', 'Elige una fecha tentativa con al menos 7 días de anticipación. Te contactaremos para confirmar.')
            : tr('dist.calendarNoteNational', 'Elige cuándo te gustaría recibirla. La fecha es tentativa y la solicitud queda sujeta a revisión.');
        setText(document.getElementById('distTastingCopy'), isLocal
            ? tr('dist.localCopy', 'Elige una fecha tentativa para visitarte. Revisamos tu solicitud y te confirmamos personalmente.')
            : tr('dist.nationalCopy', 'Cuéntanos dónde estás y cuándo te gustaría recibirla. Revisamos tu solicitud antes de enviar producto.'));
        renderCalendar();
    }

    document.querySelectorAll('.dist__route').forEach(function (button) {
        button.addEventListener('click', function () {
            route = button.getAttribute('data-route') || 'local';
            showError('');
            updateRoute();
        });
    });

    document.querySelectorAll('.dist__toggle-btn').forEach(function (button) {
        button.addEventListener('click', function () {
            document.querySelectorAll('.dist__toggle-btn').forEach(function (item) { item.classList.remove('on'); });
            button.classList.add('on');
            leadType = button.getAttribute('data-type') || 'botella';
            setText(hintEl, hints[leadType] || '');
        });
    });

    calendarGrid.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-date]');
        if (!button || button.disabled) return;
        selectedDate = button.getAttribute('data-date');
        dateInput.value = selectedDate;
        showError('');
        renderCalendar();
    });

    calendarPrev.addEventListener('click', function () {
        if (calendarPrev.disabled) return;
        cursor.month -= 1;
        if (cursor.month < 0) { cursor.month = 11; cursor.year -= 1; }
        renderCalendar();
    });

    calendarNext.addEventListener('click', function () {
        cursor.month += 1;
        if (cursor.month > 11) { cursor.month = 0; cursor.year += 1; }
        renderCalendar();
    });

    function validate() {
        var name = document.getElementById('ldName').value.trim();
        var email = document.getElementById('ldEmail').value.trim();
        var company = document.getElementById('ldCompany').value.trim();
        var volume = document.getElementById('ldVolume').value.trim();
        if (document.getElementById('ldWebsite').value.trim()) return tr('validation.noRequest', 'No se pudo enviar la solicitud.');
        if (route === 'local' && (!selectedDate || !isValidYmd(selectedDate) || selectedDate < addDays(getMexicoDate(), 7))) {
            return tr('validation.chooseDate', 'Elige una fecha con al menos 7 días de anticipación.');
        }
        if (!name) return tr('validation.name', 'Escribe tu nombre.');
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return tr('validation.email', 'Escribe un correo válido.');
        if (!company) return tr('validation.company', 'Escribe el nombre de tu negocio.');
        if (!volume) return tr('validation.volume', 'Cuéntanos qué volumen te gustaría explorar.');
        if (route === 'local' && !municipality.value) return tr('validation.municipality', 'Selecciona tu municipio.');
        if (route === 'nacional' && (!state.value.trim() || !city.value.trim())) return tr('validation.nationalLocation', 'Escribe tu estado y ciudad.');
        return '';
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        showError('');
        var validationError = validate();
        if (validationError) { showError(validationError); return; }
        if (!sb) { showError(tr('validation.noConnection', 'No pudimos conectar el formulario. Escríbenos a hola@queenshidro.com.')); return; }

        var originalLabel = submit.textContent;
        submit.disabled = true;
        submit.textContent = tr('dist.send', 'Enviando...');
        var payload = {
            request_type: route,
            desired_date: route === 'local' ? selectedDate : '',
            municipality: route === 'local' ? municipality.value : '',
            state: route === 'local' ? 'Nuevo León' : state.value.trim(),
            city: route === 'local' ? municipality.value : city.value.trim(),
            full_name: document.getElementById('ldName').value.trim(),
            email: document.getElementById('ldEmail').value.trim(),
            phone: document.getElementById('ldPhone').value.trim(),
            company: document.getElementById('ldCompany').value.trim(),
            desired_volume: document.getElementById('ldVolume').value.trim(),
            lead_type: leadType,
            notes: document.getElementById('ldMessage').value.trim(),
            website: document.getElementById('ldWebsite').value.trim()
        };

        try {
            var result = await sb.functions.invoke('submit-tasting-request', { body: payload });
            if (result.error || (result.data && !result.data.ok)) {
                throw new Error((result.data && result.data.error) || tr('validation.error', 'No se pudo enviar la solicitud.'));
            }
            form.reset();
            selectedDate = '';
            dateInput.value = '';
            leadType = 'botella';
            document.querySelectorAll('.dist__toggle-btn').forEach(function (item) { item.classList.remove('on'); });
            document.getElementById('distBtnBottle').classList.add('on');
            setText(hintEl, hints.botella);
            updateRoute();
            successEl.hidden = false;
            submit.textContent = tr('dist.sent', 'Solicitud enviada');
            setTimeout(function () {
                successEl.hidden = true;
                submit.disabled = false;
                submit.textContent = route === 'local' ? tr('dist.requestVisit', 'Solicitar visita') : tr('dist.requestTasting', 'Solicitar degustación');
            }, 5000);
        } catch (error) {
            showError(error.message || tr('validation.error', 'No se pudo enviar la solicitud.'));
            submit.disabled = false;
            submit.textContent = originalLabel;
        }
    });

    var textKeys = {
        distTag: 'dist_tag',
        distTitle: 'dist_title',
        distSub: 'dist_sub',
        distText: 'dist_text',
        distFeat1Title: 'dist_feat1_title',
        distFeat1Desc: 'dist_feat1_desc',
        distFeat2Title: 'dist_feat2_title',
        distFeat2Desc: 'dist_feat2_desc',
        distFeat3Title: 'dist_feat3_title',
        distFeat3Desc: 'dist_feat3_desc',
        distContactTitle: 'dist_contact_title',
        distContactSub: 'dist_contact_sub'
    };
    var textIds = Object.keys(textKeys).map(function (key) { return textKeys[key]; });
    if (sb) {
        sb.from('site_content').select('key,value').in('key', textIds.concat(['dist_hint_bottle', 'dist_hint_barrel'])).then(function (result) {
            if (!result.data) return;
            result.data.forEach(function (content) {
                if (content.key === 'dist_hint_bottle' && content.value) hints.botella = content.value;
                if (content.key === 'dist_hint_barrel' && content.value) hints.barril = content.value;
                var id = Object.keys(textKeys).find(function (key) { return textKeys[key] === content.key; });
                var element = id && document.getElementById(id);
                if (element && content.value) {
                    var localized = window.QH.i18n && window.QH.i18n.language() !== 'es' && window.QH.i18n.cmsText
                        ? window.QH.i18n.cmsText(content.key, content.value)
                        : content.value;
                    setText(element, localized || content.value);
                }
            });
            setText(hintEl, hints[leadType] || '');
            updateRoute();
        });
    }

    window.addEventListener('qh:langchange', function () {
        updateRoute();
        renderCalendar();
        setText(hintEl, hints[leadType] || '');
    });

    updateRoute();
    renderCalendar();
});
