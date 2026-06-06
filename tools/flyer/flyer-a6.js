(function () {
    'use strict';

    var A6_STATE = {
        isA6: false,
        bg: 'a6',
        theme: '01'
    };

    var A4_THEMES = [
        { value: 'simple', label: '시안1' },
        { value: 'standard', label: '시안2' },
        { value: 'premium', label: '시안3' }
    ];

    var A6_THEMES = [
        { value: '01', label: '시안1' },
        { value: '02', label: '시안2' }
    ];

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getValue(id, fallback) {
        var el = document.getElementById(id);
        var value = el ? String(el.value || '').trim() : '';
        return value || fallback || '';
    }

    function getA6Data() {
        return {
            label: getValue('flyerLabelInput', '프리미엄 오피스텔'),
            title: getValue('flyerTitleInput', '휴먼블루드빌'),
            copy: getValue('flyerCopyInput', '울산 시청 옆 수익형 오피스텔'),
            location: getValue('flyerLocationInput', '울산 시청 바로 옆'),
            point1: getValue('flyerPoint1Input', '회사보유분 특별분양'),
            point2: getValue('flyerPoint2Input', '30% 할인 조건'),
            point3: getValue('flyerPoint3Input', '4천 전후 실투자금'),
            benefit: getValue('flyerBenefitInput', '잔여 호실 특별 조건 안내'),
            desc: getValue('flyerDescInput', '회사보유분 특별 조건은 잔여 호실과 상담 시점에 따라 달라질 수 있습니다.'),
            manager: getValue('flyerManagerInput', '팀장\n김지모'),
            phone: getValue('flyerPhoneInput', '010-0000-0000')
        };
    }

    function createA6CardHtml(data) {
        return '' +
            '<div class="flyer-a6-card-inner">' +
            '<div>' +
            '<div class="flyer-a6-label">' + escapeHtml(data.label) + '</div>' +
            '<div class="flyer-a6-title">' + escapeHtml(data.title) + '</div>' +
            '<div class="flyer-a6-copy">' + escapeHtml(data.copy) + '</div>' +
            '<div class="flyer-a6-location">' + escapeHtml(data.location) + '</div>' +
            '</div>' +

            '<div class="flyer-a6-points">' +
            '<div class="flyer-a6-point"><span>01</span>' + escapeHtml(data.point1) + '</div>' +
            '<div class="flyer-a6-point"><span>02</span>' + escapeHtml(data.point2) + '</div>' +
            '<div class="flyer-a6-point"><span>03</span>' + escapeHtml(data.point3) + '</div>' +
            '</div>' +

            '<div class="flyer-a6-benefit">' +
            '<strong>' + escapeHtml(data.benefit) + '</strong>' +
            '<p>' + escapeHtml(data.desc) + '</p>' +
            '</div>' +

            '<div class="flyer-a6-contact">' +
            '<div class="flyer-a6-manager">' + escapeHtml(data.manager) + '</div>' +
            '<div class="flyer-a6-phone">' + escapeHtml(data.phone) + '</div>' +
            '</div>' +
            '</div>';
    }

    function getA6Sheet() {
        return document.getElementById('flyerA6Sheet');
    }

    function normalizeBg(value) {
        return 'a6';
    }

    function getCurrentBgFromA4() {
        var preview = document.getElementById('flyerPreview');

        if (!preview) return 'apartment';

        if (preview.classList.contains('flyer-bg-office')) {
            return 'office';
        }

        return 'apartment';
    }

    function getCurrentA4Theme() {
        var preview = document.getElementById('flyerPreview');

        if (!preview) return 'simple';

        if (preview.classList.contains('flyer-theme-premium')) {
            return 'premium';
        }

        if (preview.classList.contains('flyer-theme-standard')) {
            return 'standard';
        }

        return 'simple';
    }

    function applyA6SheetClass() {
        var sheet = getA6Sheet();

        if (!sheet) return;

        sheet.classList.remove(
            'flyer-a6-bg-apartment',
            'flyer-a6-bg-office',
            'flyer-a6-bg-a6',
            'flyer-a6-theme-01',
            'flyer-a6-theme-02',
            'flyer-a6-theme-03'
        );

        sheet.classList.add(
            'flyer-a6-bg-a6',
            A6_STATE.theme === '02' ? 'flyer-a6-theme-02' : 'flyer-a6-theme-01'
        );

        sheet.dataset.bg = 'a6';
        sheet.dataset.theme = A6_STATE.theme === '02' ? 'flyer-a6-theme-02' : 'flyer-a6-theme-01';
    }

    function forceA6BackgroundImage() {
        var sheet = getA6Sheet();

        if (!sheet) return;

        var bgUrl = A6_STATE.theme === '02'
            ? '/tools/flyer/images/a6-off-02-bg.jpg'
            : '/tools/flyer/images/a6-off-01-bg.jpg';

        sheet.querySelectorAll('.flyer-a6-card').forEach(function (card) {
            card.style.setProperty('background-image', 'url("' + bgUrl + '")', 'important');
            card.style.setProperty('background-size', '100% 100%', 'important');
            card.style.setProperty('background-position', 'center', 'important');
            card.style.setProperty('background-repeat', 'no-repeat', 'important');
        });
    }

    function renderA6Cards() {
        var sheet = getA6Sheet();

        if (!sheet) return;

        var cards = sheet.querySelectorAll('.flyer-a6-card');
        var data = getA6Data();
        var html = createA6CardHtml(data);

        cards.forEach(function (card) {
            card.innerHTML = html;
        });

        applyA6SheetClass();
        forceA6BackgroundImage();
        markA6EditTargets();
        restoreActiveEditSelection();
    }

    function updateSizeBadge(isA6) {
        var sizeBadge = document.getElementById('flyerSizeBadge');

        if (sizeBadge) {
            sizeBadge.textContent = isA6 ? 'A6' : 'A4';
        }
    }

    function setThemeButtonLabelsForA4() {
        var buttons = document.querySelectorAll('.flyer-theme-menu-list .flyer-color-btn');

        buttons.forEach(function (button, index) {
            var theme = A4_THEMES[index];

            if (!theme) {
                button.classList.add('flyer-a6-theme-hidden');
                button.classList.remove('is-active');
                return;
            }

            button.classList.remove('flyer-a6-theme-hidden');
            button.textContent = theme.label;
            button.setAttribute('data-flyer-theme', theme.value);
            button.classList.toggle('is-active', getCurrentA4Theme() === theme.value);
        });
    }

    function setThemeButtonLabelsForA6() {
        var buttons = document.querySelectorAll('.flyer-theme-menu-list .flyer-color-btn');

        buttons.forEach(function (button, index) {
            var theme = A6_THEMES[index];

            if (!theme) {
                button.classList.add('flyer-a6-theme-hidden');
                button.classList.remove('is-active');
                return;
            }

            button.classList.remove('flyer-a6-theme-hidden');
            button.textContent = theme.label;
            button.setAttribute('data-flyer-a6-theme', theme.value);
            button.classList.toggle('is-active', A6_STATE.theme === theme.value);
        });
    }

    function syncBgButtons() {
        document.querySelectorAll('.flyer-bg-btn').forEach(function (button) {
            var value = normalizeBg(button.getAttribute('data-flyer-bg'));
            button.classList.toggle('is-active', A6_STATE.bg === value);
        });
    }

    function setA6Mode(isA6) {
        var previewWrap = document.querySelector('.flyer-preview-wrap');
        var a4Preview = document.getElementById('flyerPreview');
        var a6Sheet = getA6Sheet();
        var toggleBtn = document.getElementById('flyerSizeToggleBtn');

        if (!previewWrap || !a4Preview || !a6Sheet || !toggleBtn) return;

        A6_STATE.isA6 = !!isA6;

        /*
            핵심:
            A6는 A4 배경/시안과 연결하지 않는다.
            A4가 일반 배경이든 아파트든 오피스텔이든,
            A6 버튼을 누르면 A6 전용 기본폼만 출력한다.
        */
        if (A6_STATE.isA6) {
            A6_STATE.bg = 'a6';
            A6_STATE.theme = '01';
        }

        previewWrap.classList.toggle('is-a6-mode', A6_STATE.isA6);

        if (A6_STATE.isA6) {
            a4Preview.classList.add('is-hidden');
            a4Preview.setAttribute('aria-hidden', 'true');
            a4Preview.style.setProperty('display', 'none', 'important');

            a6Sheet.classList.remove('is-hidden');
            a6Sheet.setAttribute('aria-hidden', 'false');
            a6Sheet.style.setProperty('display', 'block', 'important');

            a6Sheet.classList.remove(
                'flyer-a6-bg-apartment',
                'flyer-a6-bg-office',
                'flyer-a6-bg-a6',
                'flyer-a6-theme-01',
                'flyer-a6-theme-02',
                'flyer-a6-theme-03'
            );

            a6Sheet.classList.add('flyer-a6-bg-a6');
            a6Sheet.classList.add('flyer-a6-theme-01');
            a6Sheet.dataset.bg = 'a6';
            a6Sheet.dataset.theme = 'flyer-a6-theme-01';

            setThemeButtonLabelsForA6();
            syncBgButtons();

            renderA6Cards();

            window.requestAnimationFrame(function () {
                renderA6Cards();
                refreshEditTargets();
            });

            window.setTimeout(function () {
                renderA6Cards();
                refreshEditTargets();
            }, 120);
        } else {
            a4Preview.classList.remove('is-hidden');
            a4Preview.setAttribute('aria-hidden', 'false');
            a4Preview.style.removeProperty('display');

            a6Sheet.classList.add('is-hidden');
            a6Sheet.setAttribute('aria-hidden', 'true');
            a6Sheet.style.setProperty('display', 'none', 'important');

            setThemeButtonLabelsForA4();
        }

        toggleBtn.textContent = A6_STATE.isA6 ? 'A4 전단 보기' : 'A6 전단 보기';
        updateSizeBadge(A6_STATE.isA6);
        restoreActiveEditSelection();
    }

    function bindA6Inputs() {
        var inputIds = [
            'flyerLabelInput',
            'flyerTitleInput',
            'flyerCopyInput',
            'flyerLocationInput',
            'flyerPoint1Input',
            'flyerPoint2Input',
            'flyerPoint3Input',
            'flyerBenefitInput',
            'flyerDescInput',
            'flyerManagerInput',
            'flyerPhoneInput'
        ];

        inputIds.forEach(function (id) {
            var el = document.getElementById(id);

            if (!el) return;

            el.addEventListener('input', function () {
                if (A6_STATE.isA6) {
                    renderA6Cards();
                }
            });
        });
    }

    function bindA6Toggle() {
        var toggleBtn = document.getElementById('flyerSizeToggleBtn');

        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', function () {
            setA6Mode(!A6_STATE.isA6);
        });
    }

    function bindA6BackgroundButtons() {
        document.querySelectorAll('.flyer-bg-btn').forEach(function (button) {
            button.addEventListener('click', function () {
                if (!A6_STATE.isA6) return;

                /*
                    A6는 A4의 일반/아파트/오피스텔 배경 선택과 연결하지 않는다.
                    A6는 시안1/시안2만으로 a6-off-01/a6-off-02 배경을 사용한다.
                */
                A6_STATE.bg = 'a6';

                syncBgButtons();
                renderA6Cards();

                var details = button.closest('details');

                if (details) {
                    details.removeAttribute('open');
                }
            });
        });
    }

    function bindA6ThemeButtons() {
        var menu = document.querySelector('.flyer-theme-menu-list');

        if (!menu) return;

        menu.addEventListener('click', function (event) {
            var button = event.target.closest('.flyer-color-btn');

            if (!button || !A6_STATE.isA6) return;

            var nextTheme = button.getAttribute('data-flyer-a6-theme');

            if (nextTheme !== '02') {
                nextTheme = '01';
            }

            A6_STATE.theme = nextTheme;

            setThemeButtonLabelsForA6();
            renderA6Cards();

            var details = button.closest('details');

            if (details) {
                details.removeAttribute('open');
            }
        });
    }
    var ACTIVE_EDIT_FIELD = '';

    var EDIT_TARGETS = [
        {
            field: 'label',
            label: '전단 라벨',
            inputId: 'flyerLabelInput',
            a4Id: 'flyerPreviewLabel',
            a6Selector: '.flyer-a6-label',
            maxLength: 16
        },
        {
            field: 'title',
            label: '현장명',
            inputId: 'flyerTitleInput',
            a4Id: 'flyerPreviewTitle',
            a6Selector: '.flyer-a6-title',
            maxLength: 18
        },
        {
            field: 'copy',
            label: '한줄 카피',
            inputId: 'flyerCopyInput',
            a4Id: 'flyerPreviewCopy',
            a6Selector: '.flyer-a6-copy',
            maxLength: 30
        },
        {
            field: 'location',
            label: '위치',
            inputId: 'flyerLocationInput',
            a4Id: 'flyerPreviewLocation',
            a6Selector: '.flyer-a6-location',
            maxLength: 28
        },
        {
            field: 'point1',
            label: '조건 1',
            inputId: 'flyerPoint1Input',
            a4Id: 'flyerPreviewPoint1',
            a6Selector: '.flyer-a6-point:nth-child(1)',
            maxLength: 24
        },
        {
            field: 'point2',
            label: '조건 2',
            inputId: 'flyerPoint2Input',
            a4Id: 'flyerPreviewPoint2',
            a6Selector: '.flyer-a6-point:nth-child(2)',
            maxLength: 24
        },
        {
            field: 'point3',
            label: '조건 3',
            inputId: 'flyerPoint3Input',
            a4Id: 'flyerPreviewPoint3',
            a6Selector: '.flyer-a6-point:nth-child(3)',
            maxLength: 24
        },
        {
            field: 'benefit',
            label: '강조 문구',
            inputId: 'flyerBenefitInput',
            a4Id: 'flyerPreviewBenefit',
            a6Selector: '.flyer-a6-benefit strong',
            maxLength: 30
        },
        {
            field: 'desc',
            label: '상세 안내',
            inputId: 'flyerDescInput',
            a4Id: 'flyerPreviewDesc',
            a6Selector: '.flyer-a6-benefit p',
            maxLength: 70
        },
        {
            field: 'manager',
            label: '상담자',
            inputId: 'flyerManagerInput',
            a4Id: 'flyerPreviewManager',
            a6Selector: '.flyer-a6-manager',
            maxLength: 12
        },
        {
            field: 'phone',
            label: '연락처',
            inputId: 'flyerPhoneInput',
            a4Id: 'flyerPreviewPhone',
            a6Selector: '.flyer-a6-phone',
            maxLength: 16
        }
    ];
    function getEditConfig(field) {
        var found = null;

        EDIT_TARGETS.forEach(function (item) {
            if (item.field === field) {
                found = item;
            }
        });

        return found;
    }

    function getEditInputValue(config) {
        var sourceInput = config ? document.getElementById(config.inputId) : null;

        return sourceInput ? String(sourceInput.value || '') : '';
    }

    function updateEditCount(value, maxLength) {
        var count = document.getElementById('flyerEditCount');

        if (!count) return;

        count.textContent = String(value || '').length + ' / ' + maxLength;
    }

    function updateEditBar(field) {
        var config = getEditConfig(field);
        var label = document.getElementById('flyerEditFieldLabel');
        var input = document.getElementById('flyerEditInput');

        if (!label || !input || !config) return;

        var value = getEditInputValue(config);

        label.textContent = config.label;
        input.disabled = false;
        input.value = value;
        input.maxLength = config.maxLength;
        input.placeholder = config.label + ' 입력';

        updateEditCount(value, config.maxLength);

        /* 푸터 입력창을 쓰는 구조에서는
           숨겨진 기존 입력창에 focus/select를 주면 화면이 아래로 튐 */
    }

    function restoreActiveEditSelection() {
        if (!ACTIVE_EDIT_FIELD) return;

        var config = getEditConfig(ACTIVE_EDIT_FIELD);
        var target = null;

        if (!config) return;

        if (A6_STATE.isA6) {
            var sheet = getA6Sheet();
            var firstCard = sheet ? sheet.querySelector('.flyer-a6-card:first-child') : null;

            target = firstCard ? firstCard.querySelector('[data-edit-field="' + ACTIVE_EDIT_FIELD + '"]') : null;
        } else {
            target = document.getElementById(config.a4Id);
        }

        if (target) {
            clearEditSelection();
            target.classList.add('is-editing');
        }
    }

    function selectEditField(field, target) {
        var config = getEditConfig(field);

        if (!config) return;

        ACTIVE_EDIT_FIELD = field;

        clearEditSelection();

        if (target) {
            target.classList.add('is-editing');
        } else {
            restoreActiveEditSelection();
        }

        updateEditBar(field);
    }

    function bindFlyerEditBar() {
        var input = document.getElementById('flyerEditInput');

        if (!input || input.dataset.editBarBound === 'true') return;

        input.dataset.editBarBound = 'true';

        input.addEventListener('input', function () {
            var config = getEditConfig(ACTIVE_EDIT_FIELD);

            if (!config) return;

            var sourceInput = document.getElementById(config.inputId);

            if (!sourceInput) return;

            sourceInput.value = input.value;

            updateEditCount(input.value, config.maxLength);

            sourceInput.dispatchEvent(new Event('input', {
                bubbles: true
            }));

            restoreActiveEditSelection();
        });
    }

    function clearEditSelection() {
        document.querySelectorAll('.flyer-edit-target.is-editing').forEach(function (target) {
            target.classList.remove('is-editing');
        });
    }

    function markA4EditTargets() {
        EDIT_TARGETS.forEach(function (item) {
            var target = document.getElementById(item.a4Id);

            if (!target) return;

            target.classList.add('flyer-edit-target');
            target.setAttribute('data-edit-field', item.field);
        });
    }

    function markA6EditTargets() {
        var sheet = getA6Sheet();

        if (!sheet) return;

        var firstCard = sheet.querySelector('.flyer-a6-card:first-child');

        if (!firstCard) return;

        EDIT_TARGETS.forEach(function (item) {
            var target = firstCard.querySelector(item.a6Selector);

            if (!target) return;

            target.classList.add('flyer-edit-target');
            target.setAttribute('data-edit-field', item.field);
        });
    }

    function refreshEditTargets() {
        markA4EditTargets();
        markA6EditTargets();
    }

    function bindFlyerEditSelect() {
        var previewWrap = document.querySelector('.flyer-preview-wrap');

        if (!previewWrap || previewWrap.dataset.editSelectBound === 'true') return;

        previewWrap.dataset.editSelectBound = 'true';

        previewWrap.addEventListener('click', function (event) {
            var target = event.target.closest('.flyer-edit-target');

            if (!target || !previewWrap.contains(target)) return;

            var a6Card = target.closest('.flyer-a6-card');

            if (a6Card && !a6Card.matches(':first-child')) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            selectEditField(target.getAttribute('data-edit-field'), target);
        });
    }

    function normalizeInitialLabels() {
        setThemeButtonLabelsForA4();
        updateSizeBadge(false);
    }

    window.bootFlyerA6Tool = function () {
        A6_STATE.isA6 = false;
        A6_STATE.bg = 'a6';
        A6_STATE.theme = '01';

        bindA6Toggle();
        bindA6Inputs();
        bindA6BackgroundButtons();
        bindA6ThemeButtons();

        normalizeInitialLabels();

        renderA6Cards();
        refreshEditTargets();
        bindFlyerEditSelect();
        bindFlyerEditBar();

        setA6Mode(false);

        window.requestAnimationFrame(function () {
            renderA6Cards();
            refreshEditTargets();
        });

        window.setTimeout(function () {
            renderA6Cards();
            refreshEditTargets();
        }, 120);
    };
})();