(function () {
    'use strict';

    var FLYER_DRAFT_KEY = 'zimo_biz_flyer_draft_v2';
    var flyerCustomBgObjectUrl = '';
    var flyerMiniMapSnapshotTimer = null;
    var flyerMiniMapSnapshotToken = 0;
    var flyerMiniMapOriginalHtml = null;
    var flyerMiniMapObserver = null;

    function safeText(value, fallback) {
        var text = String(value || '').trim();
        return text || fallback;
    }

    function onlyPhone(value) {
        return String(value || '').replace(/[^\d+]/g, '');
    }

    function getEls() {
        return {
            form: document.getElementById('flyerForm'),

            labelInput: document.getElementById('flyerLabelInput'),
            titleInput: document.getElementById('flyerTitleInput'),
            copyInput: document.getElementById('flyerCopyInput'),
            locationInput: document.getElementById('flyerLocationInput'),

            point1Input: document.getElementById('flyerPoint1Input'),
            point2Input: document.getElementById('flyerPoint2Input'),
            point3Input: document.getElementById('flyerPoint3Input'),

            benefitInput: document.getElementById('flyerBenefitInput'),
            desc1Input: document.getElementById('flyerDesc1Input'),
            desc2Input: document.getElementById('flyerDesc2Input'),

            managerInput: document.getElementById('flyerManagerInput'),
            phoneInput: document.getElementById('flyerPhoneInput'),



            preview: document.getElementById('flyerPreview'),
            previewHero: document.getElementById('flyerPreviewHero'),

            previewLabel: document.getElementById('flyerPreviewLabel'),
            previewTitle: document.getElementById('flyerPreviewTitle'),
            previewCopy: document.getElementById('flyerPreviewCopy'),
            previewLocation: document.getElementById('flyerPreviewLocation'),

            previewPoint1: document.getElementById('flyerPreviewPoint1'),
            previewPoint2: document.getElementById('flyerPreviewPoint2'),
            previewPoint3: document.getElementById('flyerPreviewPoint3'),

            previewBenefit: document.getElementById('flyerPreviewBenefit'),
            previewDesc: document.getElementById('flyerPreviewDesc'),
            previewDesc1: document.getElementById('flyerPreviewDesc1'),
            previewDesc2: document.getElementById('flyerPreviewDesc2'),

            previewManager: document.getElementById('flyerPreviewManager'),
            previewPhone: document.getElementById('flyerPreviewPhone'),

            saveBtn: document.getElementById('flyerSaveBtn'),
            resetBtn: document.getElementById('flyerResetBtn'),

            downloadBtn: document.getElementById('flyerDownloadBtn'),
            downloadPopover: document.getElementById('flyerDownloadPopover'),

            bgUploadInput: document.getElementById('flyerBgUploadInput'),
            bgUploadLabel: document.getElementById('flyerBgUploadLabel'),
            previewWrap: document.querySelector('.flyer-preview-wrap'),
            a6Sheet: document.getElementById('flyerA6Sheet'),
            sizeToggleBtn: document.getElementById('flyerSizeToggleBtn'),
            sizeBadge: document.getElementById('flyerSizeBadge'),
            generalHeroImage: document.getElementById('flyerGeneralHeroImage')
        };
    }

    function getActiveValue(attributeName, fallback) {
        var active = document.querySelector('[' + attributeName + '].is-active');

        if (!active) return fallback;

        return active.getAttribute(attributeName) || fallback;
    }
    function getCurrentFlyerBackground() {
        var preview = document.getElementById('flyerPreview');

        if (preview) {
            if (preview.classList.contains('flyer-bg-office')) {
                return 'office';
            }

            if (preview.classList.contains('flyer-bg-general')) {
                return 'general';
            }

            if (preview.classList.contains('flyer-bg-apartment')) {
                return 'apartment';
            }
        }

        return getActiveValue('data-flyer-bg', 'apartment');
    }

    function getCurrentData(els) {
        return {
            label: els.labelInput ? els.labelInput.value : '',
            title: els.titleInput ? els.titleInput.value : '',
            copy: els.copyInput ? els.copyInput.value : '',
            location: els.locationInput ? els.locationInput.value : '',

            point1: els.point1Input ? els.point1Input.value : '',
            point2: els.point2Input ? els.point2Input.value : '',
            point3: els.point3Input ? els.point3Input.value : '',

            benefit: els.benefitInput ? els.benefitInput.value : '',
            desc1: els.desc1Input ? els.desc1Input.value : '',
            desc2: els.desc2Input ? els.desc2Input.value : '',

            manager: els.managerInput ? els.managerInput.value : '',
            phone: els.phoneInput ? els.phoneInput.value : '',

            background: getCurrentFlyerBackground(),
            theme: getActiveValue('data-flyer-theme', 'simple'),
            overlay: getActiveValue('data-flyer-overlay', 'soft')
        };
    }
    function getFlyerDefaults(background) {
        var bg = background || getActiveValue('data-flyer-bg', 'apartment');

        if (bg === 'office') {
            return {
                label: '프리미엄 오피스텔',
                title: '휴먼블루드빌',
                copy: '울산 시청 옆 수익형 오피스텔',
                location: '울산 시청 바로 옆',
                point1: '회사보유분 특별분양',
                point2: '30% 할인 조건',
                point3: '4천 전후 실투자금',
                benefit: '잔여 호실 특별 조건 안내',
                desc1: '회사보유분 특별 조건은 잔여 호실 상담 시점에 따라 달라질 수 있습니다.',
                desc2: '정확한 내용은 상담을 통해 안내드립니다.',
                manager: '김지모 팀장',
                phone: '010-0000-0000'
            };
        }

        return {
            label: '울산 신규 아파트',
            title: '문수로 써밋 블루밍',
            copy: '울산 중심 생활권 프리미엄 아파트',
            location: '울산 남구 생활권',
            point1: '선착순 동호 지정',
            point2: '계약금 정액제',
            point3: '중도금 무이자',
            benefit: '잔여세대 특별 조건 안내',
            desc1: '일부 세대 한정 조건은 상담 시점에 따라 달라질 수 있습니다.',
            desc2: '방문 예약 시 자세한 혜택을 안내드립니다.',
            manager: '김지모 팀장',
            phone: '010-0000-0000'
        };
    }
    function applyFlyerDefaultsToInputs(els, background) {
        var defaults = getFlyerDefaults(background);

        if (els.labelInput) els.labelInput.value = defaults.label;
        if (els.titleInput) els.titleInput.value = defaults.title;
        if (els.copyInput) els.copyInput.value = defaults.copy;
        if (els.locationInput) els.locationInput.value = defaults.location;

        if (els.point1Input) els.point1Input.value = defaults.point1;
        if (els.point2Input) els.point2Input.value = defaults.point2;
        if (els.point3Input) els.point3Input.value = defaults.point3;

        if (els.benefitInput) els.benefitInput.value = defaults.benefit;
        if (els.desc1Input) els.desc1Input.value = defaults.desc1;
        if (els.desc2Input) els.desc2Input.value = defaults.desc2;

        if (els.managerInput) els.managerInput.value = defaults.manager;
        if (els.phoneInput) els.phoneInput.value = defaults.phone;
    }

    function isKnownFlyerDefault(value, key) {
        var text = String(value || '').trim();
        var apartmentDefaults = getFlyerDefaults('apartment');
        var officeDefaults = getFlyerDefaults('office');

        return text === '' ||
            text === apartmentDefaults[key] ||
            text === officeDefaults[key];
    }

    function syncInputsToBackgroundDefaults(els, background) {
        var defaults = getFlyerDefaults(background);

        var pairs = [
            ['labelInput', 'label'],
            ['titleInput', 'title'],
            ['copyInput', 'copy'],
            ['locationInput', 'location'],
            ['point1Input', 'point1'],
            ['point2Input', 'point2'],
            ['point3Input', 'point3'],
            ['benefitInput', 'benefit'],
            ['desc1Input', 'desc1'],
            ['desc2Input', 'desc2'],
            ['managerInput', 'manager'],
            ['phoneInput', 'phone']
        ];

        pairs.forEach(function (pair) {
            var input = els[pair[0]];
            var key = pair[1];

            if (!input) return;

            /*
                사용자가 직접 고친 문구는 건드리지 않고,
                빈 값이거나 기존 아파트/오피스텔 기본 문구일 때만 교체한다.
            */
            if (isKnownFlyerDefault(input.value, key)) {
                input.value = defaults[key];
            }
        });
    }

    function setText(el, value, fallback) {
        if (!el) return;
        el.textContent = safeText(value, fallback);
    }

    function updatePreview() {
        var els = getEls();

        if (!els.preview) return;

        var defaults = getFlyerDefaults(getCurrentFlyerBackground());

        setText(els.previewLabel, els.labelInput && els.labelInput.value, defaults.label);
        setText(els.previewTitle, els.titleInput && els.titleInput.value, defaults.title);
        setText(els.previewCopy, els.copyInput && els.copyInput.value, defaults.copy);
        setText(els.previewLocation, els.locationInput && els.locationInput.value, defaults.location);

        setText(els.previewPoint1, els.point1Input && els.point1Input.value, defaults.point1);
        setText(els.previewPoint2, els.point2Input && els.point2Input.value, defaults.point2);
        setText(els.previewPoint3, els.point3Input && els.point3Input.value, defaults.point3);

        setText(els.previewBenefit, els.benefitInput && els.benefitInput.value, defaults.benefit);

        setText(
            els.previewDesc1,
            els.desc1Input && els.desc1Input.value,
            defaults.desc1
        );

        setText(
            els.previewDesc2,
            els.desc2Input && els.desc2Input.value,
            defaults.desc2
        );

        setText(els.previewManager, els.managerInput && els.managerInput.value, defaults.manager);

        var phoneText = safeText(els.phoneInput && els.phoneInput.value, defaults.phone);

        if (els.previewPhone) {
            els.previewPhone.textContent = phoneText;
            els.previewPhone.href = 'tel:' + onlyPhone(phoneText);
        }

        if (isFlyerA4Mode()) {
            scheduleFlyerMiniMapSnapshot();
        } else {
            renderFlyerA6Cards();
            renderFlyerA6MiniMap();
        }
    }
    function setBackground(background) {
        var els = getEls();
        var bg = background || 'apartment';

        if (!els.preview) return;

        ['apartment', 'office', 'general'].forEach(function (name) {
            els.preview.classList.remove('flyer-bg-' + name);
        });

        els.preview.classList.add('flyer-bg-' + bg);

        document.querySelectorAll('[data-flyer-bg]').forEach(function (button) {
            button.classList.toggle('is-active', button.getAttribute('data-flyer-bg') === bg);
        });

        if (els.bgUploadLabel) {
            els.bgUploadLabel.classList.toggle('is-hidden', bg !== 'general');
        }

        if (bg === 'general' && !flyerCustomBgObjectUrl) {
            showFlyerToast('일반 배경은 이미지를 업로드해서 사용할 수 있어.');
        }

        syncInputsToBackgroundDefaults(els, bg);
        updatePreview();

        if (isFlyerA4Mode()) {
            scheduleFlyerMiniMapSnapshot();
        }
    }
    function applyCustomFlyerBackground(file) {
        var els = getEls();

        if (!file || !file.type || file.type.indexOf('image/') !== 0) {
            showFlyerToast('이미지 파일만 업로드할 수 있어.');
            return;
        }

        if (flyerCustomBgObjectUrl) {
            URL.revokeObjectURL(flyerCustomBgObjectUrl);
        }

        flyerCustomBgObjectUrl = URL.createObjectURL(file);

        var bgValue = 'url("' + flyerCustomBgObjectUrl + '")';

        if (els.preview) {
            els.preview.style.setProperty('--flyer-custom-hero-bg', bgValue);
            els.preview.classList.add('has-custom-hero-image');
        }

        setBackground('general');
        saveDraft(false);
        showFlyerToast('상단 이미지가 적용됐어.');
    }

    function clearCustomFlyerBackground() {
        var els = getEls();

        if (flyerCustomBgObjectUrl) {
            URL.revokeObjectURL(flyerCustomBgObjectUrl);
            flyerCustomBgObjectUrl = '';
        }

        [els.preview, els.previewWrap, els.a6Sheet].forEach(function (target) {
            if (!target) return;
            target.style.removeProperty('--flyer-custom-bg');
            target.style.removeProperty('--flyer-custom-hero-bg');
        });

        if (els.preview) {
            els.preview.classList.remove('has-custom-hero-image');
        }

        if (els.bgUploadInput) {
            els.bgUploadInput.value = '';
        }
    }

    function setTheme(theme) {
        var els = getEls();

        if (!els.preview) return;

        ['simple', 'standard', 'premium'].forEach(function (name) {
            els.preview.classList.remove('flyer-theme-' + name);
        });

        els.preview.classList.add('flyer-theme-' + theme);

        document.querySelectorAll('[data-flyer-theme]').forEach(function (button) {
            button.classList.toggle('is-active', button.getAttribute('data-flyer-theme') === theme);
        });
        if (isFlyerA4Mode()) {
            scheduleFlyerMiniMapSnapshot();
        } else {
            renderFlyerA6Cards();
            renderFlyerA6MiniMap();
        }
    }

    function setOverlay(overlay) {
        var els = getEls();

        if (!els.preview) return;

        ['soft', 'deep', 'clean'].forEach(function (name) {
            els.preview.classList.remove('flyer-overlay-' + name);
        });

        els.preview.classList.add('flyer-overlay-' + overlay);

        document.querySelectorAll('[data-flyer-overlay]').forEach(function (button) {
            button.classList.toggle('is-active', button.getAttribute('data-flyer-overlay') === overlay);
        });
    }

    function isFlyerA4Mode() {
        var previewWrap = document.querySelector('.flyer-preview-wrap');

        return !(previewWrap && previewWrap.classList.contains('is-a6-mode'));
    }

    function scheduleFlyerMiniMapSnapshot() {
        window.clearTimeout(flyerMiniMapSnapshotTimer);

        flyerMiniMapSnapshotToken += 1;
        var snapshotToken = flyerMiniMapSnapshotToken;

        flyerMiniMapSnapshotTimer = window.setTimeout(function () {
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    renderFlyerMiniMapSnapshot(snapshotToken);
                });
            });
        }, 420);
    }

    async function renderFlyerMiniMapSnapshot(snapshotToken) {
        var miniBody = document.querySelector('.flyer-mini-map-body');
        var preview = document.getElementById('flyerPreview');

        if (!miniBody || !preview) return;

        if (typeof snapshotToken === 'undefined') {
            snapshotToken = flyerMiniMapSnapshotToken;
        }

        if (flyerMiniMapOriginalHtml === null) {
            flyerMiniMapOriginalHtml = miniBody.innerHTML;
        }

        if (!isFlyerA4Mode()) {
            renderFlyerA6MiniMap();
            return;
        }

        if (!window.html2canvas) {
            return;
        }

        try {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            await new Promise(function (resolve) {
                window.requestAnimationFrame(resolve);
            });

            var canvas = await window.html2canvas(preview, {
                scale: 1.4,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                imageTimeout: 15000,
                logging: false,
                ignoreElements: function (element) {
                    return element.classList && (
                        element.classList.contains('flyer-preview-overlay') ||
                        element.classList.contains('flyer-download-popover') ||
                        element.classList.contains('flyer-theme-menu-list') ||
                        element.classList.contains('flyer-edit-bar')
                    );
                }
            });

            /*
                A4 캡처가 끝나는 사이에 A6로 전환됐거나,
                더 최신 미니맵 갱신 요청이 생겼으면
                늦게 끝난 A4 스냅샷을 미니맵에 덮지 않는다.
            */
            if (!isFlyerA4Mode() || snapshotToken !== flyerMiniMapSnapshotToken) {
                renderFlyerA6MiniMap();
                return;
            }

            var imageData = canvas.toDataURL('image/png');

            var miniWidth = miniBody.getBoundingClientRect().width || 260;
            var safeWidth = Math.min(240, Math.max(220, miniWidth));

            /*
                A4 미니맵 전용 카드 높이.
                캡처된 이미지 비율에 맞춰 자동 계산한다.
                고정값으로 잡으면 아래 흰 여백이나 하단 잘림이 생긴다.
            */
            var miniHeight = Math.round(safeWidth * canvas.height / canvas.width);

            miniBody.innerHTML = '';
            miniBody.classList.add('is-snapshot-mode');
            miniBody.classList.remove('is-live-clone-mode');
            miniBody.setAttribute('data-mini-snapshot', 'true');

            miniBody.style.setProperty('background-image', 'url("' + imageData + '")', 'important');
            miniBody.style.setProperty('background-size', '100% auto', 'important');
            miniBody.style.setProperty('background-position', 'top center', 'important');
            miniBody.style.setProperty('background-repeat', 'no-repeat', 'important');

            miniBody.style.setProperty('width', safeWidth + 'px', 'important');
            miniBody.style.setProperty('max-width', safeWidth + 'px', 'important');
            miniBody.style.setProperty('height', miniHeight + 'px', 'important');
            miniBody.style.removeProperty('min-height');
            miniBody.style.setProperty('overflow', 'hidden', 'important');
        } catch (error) {
            console.error('Flyer mini map snapshot error:', error);
        }
    }
    function resetMiniMapInlineStyles(miniBody) {
        if (!miniBody) return;

        miniBody.classList.remove('is-snapshot-mode');
        miniBody.classList.remove('is-live-clone-mode');
        miniBody.removeAttribute('data-mini-snapshot');

        miniBody.style.removeProperty('background-image');
        miniBody.style.removeProperty('background-size');
        miniBody.style.removeProperty('background-position');
        miniBody.style.removeProperty('background-repeat');

        miniBody.style.removeProperty('width');
        miniBody.style.removeProperty('max-width');
        miniBody.style.removeProperty('height');
        miniBody.style.removeProperty('min-height');
        miniBody.style.removeProperty('overflow');
    }
    function renderFlyerA6MiniMap() {
        var miniBody = document.querySelector('.flyer-mini-map-body');
        var a6Sheet = document.getElementById('flyerA6Sheet');

        if (!miniBody || !a6Sheet) return;

        resetMiniMapInlineStyles(miniBody);

        var clone = a6Sheet.cloneNode(true);

        clone.removeAttribute('id');
        clone.classList.add('flyer-mini-clone');

        clone.style.removeProperty('display');
        clone.style.setProperty('display', 'grid', 'important');
        clone.style.setProperty('width', '280px', 'important');
        clone.style.setProperty('max-width', '280px', 'important');
        clone.style.setProperty('height', 'auto', 'important');
        clone.style.setProperty('margin', '0 auto', 'important');

        miniBody.innerHTML = '';
        miniBody.appendChild(clone);
    }
    function watchFlyerMiniMapSnapshot() {
        return;
    }

    function renderFlyerA6Cards() {
        var els = getEls();

        if (!els.a6Sheet) return;

        var cards = els.a6Sheet.querySelectorAll('.flyer-a6-card');
        if (!cards.length) return;

        var data = getCurrentData(els);

        var bg = data.background === 'office' ? 'office' : 'apartment';

        var theme = '01';

        if (data.background !== 'general' && data.theme === 'standard') {
            theme = '02';
        }

        els.a6Sheet.classList.remove(
            'flyer-a6-bg-apartment',
            'flyer-a6-bg-office',
            'flyer-a6-theme-01',
            'flyer-a6-theme-02',
            'flyer-a6-theme-03'
        );

        els.a6Sheet.classList.add('flyer-a6-bg-' + bg);
        els.a6Sheet.classList.add('flyer-a6-theme-' + theme);

        var label = safeText(data.label, '프리미엄 오피스텔');
        var title = safeText(data.title, '휴먼블루드빌');
        var copy = safeText(data.copy, '울산 시청 옆 수익형 오피스텔');
        var location = safeText(data.location, '울산 시청 바로 옆');

        var point1 = safeText(data.point1, '회사보유분 특별분양');
        var point2 = safeText(data.point2, '30% 할인 조건');
        var point3 = safeText(data.point3, '4천 전후 실투자금');

        var benefit = safeText(data.benefit, '잔여 호실 특별 조건 안내');
        var desc1 = safeText(data.desc1, '회사보유분 특별 조건은 잔여 호실 상담 시점에 따라 달라질 수 있습니다.');
        var desc2 = safeText(data.desc2, '정확한 내용은 상담을 통해 안내드립니다.');

        var manager = safeText(data.manager, '김지모 팀장');
        var phone = safeText(data.phone, '010-0000-0000');

        cards.forEach(function (card) {
            card.innerHTML = '';

            var inner = document.createElement('div');
            inner.className = 'flyer-a6-card-inner';

            inner.innerHTML =
                '<span class="flyer-a6-label"></span>' +
                '<h4 class="flyer-a6-title"></h4>' +
                '<p class="flyer-a6-copy"></p>' +
                '<em class="flyer-a6-location"></em>' +
                '<div class="flyer-a6-points">' +
                '<div class="flyer-a6-point"><span>01</span><strong></strong></div>' +
                '<div class="flyer-a6-point"><span>02</span><strong></strong></div>' +
                '<div class="flyer-a6-point"><span>03</span><strong></strong></div>' +
                '</div>' +
                '<div class="flyer-a6-benefit">' +
                '<strong></strong>' +
                '<p><span></span><span></span></p>' +
                '</div>' +
                '<div class="flyer-a6-contact">' +
                '<strong class="flyer-a6-manager"></strong>' +
                '<a class="flyer-a6-phone"></a>' +
                '</div>';

            inner.querySelector('.flyer-a6-label').textContent = label;
            inner.querySelector('.flyer-a6-title').textContent = title;
            inner.querySelector('.flyer-a6-copy').textContent = copy;
            inner.querySelector('.flyer-a6-location').textContent = location;

            inner.querySelectorAll('.flyer-a6-point strong')[0].textContent = point1;
            inner.querySelectorAll('.flyer-a6-point strong')[1].textContent = point2;
            inner.querySelectorAll('.flyer-a6-point strong')[2].textContent = point3;

            inner.querySelector('.flyer-a6-benefit strong').textContent = benefit;
            inner.querySelectorAll('.flyer-a6-benefit p span')[0].textContent = desc1;
            inner.querySelectorAll('.flyer-a6-benefit p span')[1].textContent = desc2;

            inner.querySelector('.flyer-a6-manager').textContent = manager;
            inner.querySelector('.flyer-a6-phone').textContent = phone;
            inner.querySelector('.flyer-a6-phone').setAttribute('href', 'tel:' + onlyPhone(phone));

            [
                '.flyer-a6-label',
                '.flyer-a6-title',
                '.flyer-a6-copy',
                '.flyer-a6-location',
                '.flyer-a6-benefit strong',
                '.flyer-a6-manager',
                '.flyer-a6-phone'
            ].forEach(function (selector) {
                var target = inner.querySelector(selector);
                if (target) {
                    target.classList.add('flyer-edit-target');
                }
            });

            inner.querySelectorAll('.flyer-a6-point strong').forEach(function (target) {
                target.classList.add('flyer-edit-target');
            });

            inner.querySelectorAll('.flyer-a6-benefit p span').forEach(function (target) {
                target.classList.add('flyer-edit-target');
            });

            card.appendChild(inner);
        });
    }
    function setFlyerSizeMode(mode) {
        var els = getEls();
        var isA6 = mode === 'a6';

        window.clearTimeout(flyerMiniMapSnapshotTimer);
        flyerMiniMapSnapshotToken += 1;

        if (isA6) {
            renderFlyerA6Cards();
        }

        if (els.previewWrap) {
            els.previewWrap.classList.toggle('is-a6-mode', isA6);
        }

        if (els.preview) {
            els.preview.classList.toggle('is-hidden', isA6);
            els.preview.setAttribute('aria-hidden', isA6 ? 'true' : 'false');

            if (isA6) {
                els.preview.style.setProperty('display', 'none', 'important');
            } else {
                els.preview.style.removeProperty('display');
            }
        }

        if (els.a6Sheet) {
            els.a6Sheet.classList.toggle('is-hidden', !isA6);
            els.a6Sheet.setAttribute('aria-hidden', isA6 ? 'false' : 'true');

            if (isA6) {
                els.a6Sheet.style.setProperty('display', 'block', 'important');
            } else {
                els.a6Sheet.style.setProperty('display', 'none', 'important');
            }
        }

        if (els.sizeBadge) {
            els.sizeBadge.textContent = isA6 ? 'A6' : 'A4';
        }

        if (els.sizeToggleBtn) {
            els.sizeToggleBtn.textContent = isA6 ? 'A4 전단 보기' : 'A6 전단 보기';
        }

        closeDownloadPopover();

        if (isA6) {
            renderFlyerA6MiniMap();
        } else {
            /*
                A6에서 수정한 값은 input에는 반영되지만
                숨겨져 있던 A4 미리보기 DOM은 갱신되지 않았을 수 있다.
                그래서 A4로 돌아올 때는 먼저 A4 미리보기를 다시 그리고,
                그 다음 미니맵을 캡처한다.
            */
            updatePreview();
        }
    }



    function saveDraft(showMessage) {
        var els = getEls();
        var data = getCurrentData(els);

        try {
            localStorage.setItem(FLYER_DRAFT_KEY, JSON.stringify(data));

            if (showMessage !== false) {
                showFlyerToast('웹전단 임시저장 완료.');
            }
        } catch (error) {
            showFlyerToast('저장 공간이 부족해서 임시저장하지 못했어.');
        }
    }

    function loadDraft() {
        var saved = null;

        try {
            saved = localStorage.getItem(FLYER_DRAFT_KEY);
        } catch (error) {
            saved = null;
        }

        if (!saved) {
            updatePreview();
            return;
        }

        var data;

        try {
            data = JSON.parse(saved);
        } catch (error) {
            updatePreview();
            return;
        }

        var els = getEls();

        if (els.labelInput) els.labelInput.value = data.label || '';
        if (els.titleInput) els.titleInput.value = data.title || '';
        if (els.copyInput) els.copyInput.value = data.copy || '';
        if (els.locationInput) els.locationInput.value = data.location || '';

        if (els.point1Input) els.point1Input.value = data.point1 || '';
        if (els.point2Input) els.point2Input.value = data.point2 || '';
        if (els.point3Input) els.point3Input.value = data.point3 || '';

        if (els.benefitInput) els.benefitInput.value = data.benefit || '';
        if (els.desc1Input) els.desc1Input.value = data.desc1 || data.desc || '';
        if (els.desc2Input) els.desc2Input.value = data.desc2 || '';

        if (els.managerInput) els.managerInput.value = data.manager || '';
        if (els.phoneInput) els.phoneInput.value = data.phone || '';

        setBackground(data.background || 'apartment');
        setTheme(data.theme || 'simple');
        setOverlay(data.overlay || 'soft');

        updatePreview();
    }

    function resetFlyer() {
        var els = getEls();

        /*
            초기화 기준은 "현재 화면 상태"다.
            - 현재 배경: 아파트 / 오피스텔 / 일반
            - 현재 시안
            - 현재 A4/A6 모드
        */
        var currentBackground = getCurrentFlyerBackground();
        var currentTheme = getActiveValue('data-flyer-theme', 'simple');
        var currentOverlay = getActiveValue('data-flyer-overlay', 'soft');
        var isA6 = !isFlyerA4Mode();

        /*
            이전 미니맵 예약/스냅샷은 먼저 무효화한다.
            그래야 예전 A4 캡처가 초기화 후 다시 보이지 않는다.
        */
        window.clearTimeout(flyerMiniMapSnapshotTimer);
        flyerMiniMapSnapshotToken += 1;
        resetMiniMapInlineStyles(document.querySelector('.flyer-mini-map-body'));

        if (els.form) {
            els.form.reset();
        }

        try {
            localStorage.removeItem(FLYER_DRAFT_KEY);
        } catch (error) {
            // 삭제 실패 시에도 화면은 초기화한다.
        }

        clearCustomFlyerBackground();

        /*
            현재 배경/시안은 유지한다.
            단, 입력값은 무조건 현재 배경의 기본값으로 다시 넣는다.
        */
        setBackground(currentBackground);
        setTheme(currentTheme);
        setOverlay(currentOverlay);

        applyFlyerDefaultsToInputs(els, currentBackground);

        closeDownloadPopover();

        /*
            현재 모드 기준으로 미리보기와 미니맵을 확정 갱신한다.
            A4면 A4 미리보기 + A4 미니맵
            A6면 A6 카드 + A6 미니맵
        */
        if (isA6) {
            renderFlyerA6Cards();
            renderFlyerA6MiniMap();
        } else {
            updatePreview();
        }

        saveDraft(false);

        showFlyerToast('현재 화면 기준으로 초기화했어.');
    }

    function closeDownloadPopover() {
        var els = getEls();

        if (!els.downloadPopover) return;

        els.downloadPopover.classList.remove('is-open');
        els.downloadPopover.setAttribute('aria-hidden', 'true');
    }

    function toggleDownloadPopover() {
        var els = getEls();

        if (!els.downloadPopover) return;

        var isOpen = els.downloadPopover.classList.contains('is-open');

        els.downloadPopover.classList.toggle('is-open', !isOpen);
        els.downloadPopover.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    }

    async function downloadFlyerPdf() {
        var previewWrap = document.querySelector('.flyer-preview-wrap');
        var isA6Mode = previewWrap && previewWrap.classList.contains('is-a6-mode');

        var target = isA6Mode
            ? document.getElementById('flyerA6Sheet')
            : document.getElementById('flyerPreview');

        if (!target) {
            showFlyerToast('전단 미리보기를 찾지 못했어.');
            return;
        }

        if (!window.html2canvas) {
            showFlyerToast('html2canvas가 안 불러와졌어.');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            showFlyerToast('jsPDF가 안 불러와졌어.');
            return;
        }

        try {
            showFlyerToast('PDF 다운로드 준비 중...');
            closeDownloadPopover();

            document.body.classList.add('is-flyer-pdf-capturing');
            if (isA6Mode) {
                document.body.classList.add('is-a6-pdf-exporting');
            }

            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            await new Promise(function (resolve) {
                requestAnimationFrame(resolve);
            });

            var canvas = await window.html2canvas(target, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                imageTimeout: 15000,
                logging: false,
                ignoreElements: function (element) {
                    return element.classList && (
                        element.classList.contains('flyer-preview-overlay') ||
                        element.classList.contains('flyer-download-popover') ||
                        element.classList.contains('flyer-theme-menu-list') ||
                        element.classList.contains('flyer-edit-bar')
                    );
                }
            });

            var imageData = canvas.toDataURL('image/png');

            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            var pageWidth = 210;
            var pageHeight = 297;
            var margin = isA6Mode ? 6 : 8;

            var maxWidth = pageWidth - margin * 2;
            var maxHeight = pageHeight - margin * 2;

            var imageRatio = canvas.width / canvas.height;

            var imageWidth = maxWidth;
            var imageHeight = imageWidth / imageRatio;

            if (imageHeight > maxHeight) {
                imageHeight = maxHeight;
                imageWidth = imageHeight * imageRatio;
            }

            var x = (pageWidth - imageWidth) / 2;
            var y = (pageHeight - imageHeight) / 2;

            pdf.addImage(imageData, 'PNG', x, y, imageWidth, imageHeight);
            pdf.save(isA6Mode ? 'zimo-biz-flyer-a6.pdf' : 'zimo-biz-flyer.pdf');

            showFlyerToast('PDF 다운로드 완료.');
        } catch (error) {
            console.error('Flyer PDF error:', error);

            var message = error && error.message ? error.message : String(error);
            showFlyerToast('PDF 오류: ' + message.slice(0, 60));
        } finally {
            document.body.classList.remove('is-flyer-pdf-capturing');
            document.body.classList.remove('is-a6-pdf-exporting');
        }
    }

    function handleDownload(type) {
        closeDownloadPopover();

        if (type === 'pdf') {
            downloadFlyerPdf();
            return;
        }

        if (type === 'ppt') {
            showFlyerToast('편집 가능한 PPT 다운로드는 다음 단계에서 연결할게.');
            return;
        }

        showFlyerToast('다운로드 형식을 선택해줘.');
    }

    function bindInputs() {
        var els = getEls();

        [
            els.labelInput,
            els.titleInput,
            els.copyInput,
            els.locationInput,
            els.point1Input,
            els.point2Input,
            els.point3Input,
            els.benefitInput,
            els.desc1Input,
            els.desc2Input,
            els.managerInput,
            els.phoneInput
        ].forEach(function (input) {
            if (!input) return;

            input.addEventListener('input', function () {
                updatePreview();
                saveDraft(false);
            });
        });

        document.querySelectorAll('[data-flyer-bg]').forEach(function (button) {
            button.addEventListener('click', function () {
                var nextBg = button.getAttribute('data-flyer-bg') || 'apartment';

                setBackground(nextBg);
                saveDraft(false);

                var bgMenu = button.closest('.flyer-bg-menu');

                if (bgMenu) {
                    bgMenu.removeAttribute('open');
                }
            });
        });
        if (els.bgUploadInput) {
            els.bgUploadInput.addEventListener('change', function () {
                var file = els.bgUploadInput.files && els.bgUploadInput.files[0];

                if (!file) return;

                applyCustomFlyerBackground(file);
            });
        }

        document.querySelectorAll('[data-flyer-theme]').forEach(function (button) {
            button.addEventListener('click', function () {
                setTheme(button.getAttribute('data-flyer-theme') || 'simple');
                saveDraft(false);

                var themeMenu = button.closest('.flyer-theme-menu');

                if (themeMenu) {
                    themeMenu.removeAttribute('open');
                }
            });
        });

        document.querySelectorAll('[data-flyer-overlay]').forEach(function (button) {
            button.addEventListener('click', function () {
                setOverlay(button.getAttribute('data-flyer-overlay') || 'soft');
                saveDraft(false);
            });
        });

        if (els.saveBtn) {
            els.saveBtn.addEventListener('click', function () {
                saveDraft(true);
            });
        }

        if (els.resetBtn) {
            els.resetBtn.addEventListener('click', function () {
                resetFlyer();
            });
        }

        if (els.downloadBtn) {
            els.downloadBtn.addEventListener('click', function (event) {
                event.stopPropagation();
                toggleDownloadPopover();
            });
        }

        if (els.downloadPopover) {
            els.downloadPopover.addEventListener('click', function (event) {
                event.stopPropagation();

                var button = event.target.closest('[data-download-type]');

                if (!button) return;

                handleDownload(button.getAttribute('data-download-type'));
            });
        }
        document.addEventListener('click', function (event) {
            var themeMenu = document.querySelector('.flyer-theme-menu');
            var bgMenu = document.querySelector('.flyer-bg-menu');

            if (themeMenu && !themeMenu.contains(event.target)) {
                themeMenu.removeAttribute('open');
            }

            if (bgMenu && !bgMenu.contains(event.target)) {
                bgMenu.removeAttribute('open');
            }
        });

        document.addEventListener('click', closeDownloadPopover);
    }


    function showFlyerToast(message) {
        var oldToast = document.querySelector('.flyer-toast');

        if (oldToast) {
            oldToast.remove();
        }

        var toast = document.createElement('div');
        toast.className = 'flyer-toast';
        toast.textContent = message;

        document.body.appendChild(toast);

        window.requestAnimationFrame(function () {
            toast.classList.add('is-show');
        });

        window.setTimeout(function () {
            toast.classList.remove('is-show');

            window.setTimeout(function () {
                toast.remove();
            }, 220);
        }, 1800);
    }

    /* 상세 안내 1줄/2줄을 각각 독립 편집 대상으로 강제 */
    function bindFlyerDescLineEdit() {
        var editInput = document.getElementById('flyerEditInput');
        var editLabel = document.getElementById('flyerEditFieldLabel');
        var editCount = document.getElementById('flyerEditCount');
        var descBox = document.getElementById('flyerPreviewDesc');

        if (!editInput || !descBox) return;
        if (descBox.dataset.descLineEditBound === 'true') return;

        descBox.dataset.descLineEditBound = 'true';

        function selectDescLine(previewEl, sourceInput, label, max) {
            if (!previewEl || !sourceInput) return;

            document.querySelectorAll('.is-flyer-editing').forEach(function (el) {
                el.classList.remove('is-flyer-editing');
            });

            previewEl.classList.add('is-flyer-editing');

            editInput.disabled = false;
            editInput.value = sourceInput.value || previewEl.textContent.trim();
            editInput.maxLength = max;

            if (editLabel) {
                editLabel.textContent = label;
            }

            if (editCount) {
                editCount.textContent = String(editInput.value.length) + ' / ' + max;
            }

            editInput.focus();
            editInput.select();

            editInput.oninput = function () {
                sourceInput.value = editInput.value;
                previewEl.textContent = safeText(editInput.value, previewEl.textContent);

                if (editCount) {
                    editCount.textContent = String(editInput.value.length) + ' / ' + max;
                }

                saveDraft(false);

                /*
                    미리보기 직접 수정 시 미니맵 갱신
                    - A4: 현재 전단을 다시 캡처
                    - A6: 카드 다시 그리고 미니맵 다시 그림
                */
                if (isFlyerA4Mode()) {
                    scheduleFlyerMiniMapSnapshot();
                } else {
                    renderFlyerA6Cards();
                    renderFlyerA6MiniMap();
                }
            };
        }
        function bindFlyerEditInputMiniMapRefresh() {
            var editInput = document.getElementById('flyerEditInput');

            if (!editInput) return;
            if (editInput.dataset.miniMapRefreshBound === 'true') return;

            editInput.dataset.miniMapRefreshBound = 'true';

            editInput.addEventListener('input', function () {
                if (isFlyerA4Mode()) {
                    scheduleFlyerMiniMapSnapshot();
                } else {
                    renderFlyerA6Cards();
                    renderFlyerA6MiniMap();
                }
            });
        }

        function pickDescLine(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            var line1 = document.getElementById('flyerPreviewDesc1');
            var line2 = document.getElementById('flyerPreviewDesc2');
            var input1 = document.getElementById('flyerDesc1Input');
            var input2 = document.getElementById('flyerDesc2Input');

            if (!line1 || !line2 || !input1 || !input2) return;

            var target = event.target;

            if (target === line1) {
                selectDescLine(line1, input1, '상세 안내 1줄', 42);
                return;
            }

            if (target === line2) {
                selectDescLine(line2, input2, '상세 안내 2줄', 42);
                return;
            }

            /*
                모바일에서는 축소/스케일 때문에 span 정확히 터치가 안 될 수 있음.
                그래서 터치 Y좌표가 1줄/2줄 중 어디에 더 가까운지로 선택.
            */
            var clientY = event.clientY;

            if (event.touches && event.touches[0]) {
                clientY = event.touches[0].clientY;
            }

            if (event.changedTouches && event.changedTouches[0]) {
                clientY = event.changedTouches[0].clientY;
            }

            var rect1 = line1.getBoundingClientRect();
            var rect2 = line2.getBoundingClientRect();

            var center1 = rect1.top + rect1.height / 2;
            var center2 = rect2.top + rect2.height / 2;

            if (Math.abs(clientY - center1) <= Math.abs(clientY - center2)) {
                selectDescLine(line1, input1, '상세 안내 1줄', 42);
            } else {
                selectDescLine(line2, input2, '상세 안내 2줄', 42);
            }
        }

        bindFlyerEditInputMiniMapRefresh();

        descBox.addEventListener('click', pickDescLine, true);
        descBox.addEventListener('touchstart', pickDescLine, true);
    }
    function bindFlyerA6CardEdit() {
        var sheet = document.getElementById('flyerA6Sheet');
        var editInput = document.getElementById('flyerEditInput');
        var editLabel = document.getElementById('flyerEditFieldLabel');
        var editCount = document.getElementById('flyerEditCount');

        if (!sheet || !editInput) return;
        if (sheet.dataset.a6EditBound === 'true') return;

        sheet.dataset.a6EditBound = 'true';

        function getA6EditConfig(target, firstCard) {
            var points = Array.prototype.slice.call(firstCard.querySelectorAll('.flyer-a6-point strong'));
            var descLines = Array.prototype.slice.call(firstCard.querySelectorAll('.flyer-a6-benefit p span'));

            if (target.closest('.flyer-a6-label')) {
                return { inputId: 'flyerLabelInput', label: '상단 라벨', max: 18 };
            }

            if (target.closest('.flyer-a6-title')) {
                return { inputId: 'flyerTitleInput', label: '현장명', max: 18 };
            }

            if (target.closest('.flyer-a6-copy')) {
                return { inputId: 'flyerCopyInput', label: '한줄 카피', max: 26 };
            }

            if (target.closest('.flyer-a6-location')) {
                return { inputId: 'flyerLocationInput', label: '위치', max: 20 };
            }

            if (points.indexOf(target) === 0) {
                return { inputId: 'flyerPoint1Input', label: '조건 1', max: 18 };
            }

            if (points.indexOf(target) === 1) {
                return { inputId: 'flyerPoint2Input', label: '조건 2', max: 18 };
            }

            if (points.indexOf(target) === 2) {
                return { inputId: 'flyerPoint3Input', label: '조건 3', max: 18 };
            }

            if (target.closest('.flyer-a6-benefit strong')) {
                return { inputId: 'flyerBenefitInput', label: '혜택 강조 문구', max: 24 };
            }

            if (descLines.indexOf(target) === 0) {
                return { inputId: 'flyerDesc1Input', label: '상세 안내 1줄', max: 42 };
            }

            if (descLines.indexOf(target) === 1) {
                return { inputId: 'flyerDesc2Input', label: '상세 안내 2줄', max: 42 };
            }

            if (target.closest('.flyer-a6-manager')) {
                return { inputId: 'flyerManagerInput', label: '상담자', max: 12 };
            }

            if (target.closest('.flyer-a6-phone')) {
                return { inputId: 'flyerPhoneInput', label: '전화번호', max: 16 };
            }

            return null;
        }

        sheet.addEventListener('click', function (event) {
            if (isFlyerA4Mode()) return;

            var firstCard = sheet.querySelector('.flyer-a6-card:first-child');
            if (!firstCard || !firstCard.contains(event.target)) return;

            var target = event.target.closest('.flyer-edit-target');
            if (!target || !firstCard.contains(target)) return;

            event.preventDefault();
            event.stopPropagation();

            var config = getA6EditConfig(target, firstCard);
            if (!config) return;

            var sourceInput = document.getElementById(config.inputId);
            if (!sourceInput) return;

            document.querySelectorAll('.is-flyer-editing, .flyer-edit-target.is-editing').forEach(function (el) {
                el.classList.remove('is-flyer-editing');
                el.classList.remove('is-editing');
            });

            target.classList.add('is-editing');

            editInput.disabled = false;
            editInput.value = sourceInput.value || target.textContent.trim();
            editInput.maxLength = config.max;

            if (editLabel) {
                editLabel.textContent = config.label;
            }

            if (editCount) {
                editCount.textContent = String(editInput.value.length) + ' / ' + config.max;
            }

            editInput.focus();
            editInput.select();

            editInput.oninput = function () {
                sourceInput.value = editInput.value;

                if (editCount) {
                    editCount.textContent = String(editInput.value.length) + ' / ' + config.max;
                }

                saveDraft(false);
                renderFlyerA6Cards();
                renderFlyerA6MiniMap();
            };
        });
    }
    /* 웹전단 돌아가기 버튼을 웹전단 작업영역 오른쪽 상단으로 강제 고정 */
    function forceFlyerBackButtonPosition() {
        var flyerTool = document.getElementById('flyerTool');

        var backBtn =
            document.getElementById('flyerBackBtn') ||
            document.querySelector('.flyer-back-btn') ||
            Array.prototype.slice.call(document.querySelectorAll('button, a')).find(function (el) {
                return String(el.textContent || '').trim().indexOf('돌아가기') !== -1;
            });

        if (!flyerTool || !backBtn) return false;

        flyerTool.style.setProperty('position', 'relative', 'important');

        if (backBtn.parentElement !== flyerTool) {
            flyerTool.appendChild(backBtn);
        }

        backBtn.classList.add('flyer-back-btn');

        backBtn.style.setProperty('position', 'absolute', 'important');
        backBtn.style.setProperty('top', '92px', 'important');
        backBtn.style.setProperty('right', '44px', 'important');
        backBtn.style.setProperty('left', 'auto', 'important');
        backBtn.style.setProperty('bottom', 'auto', 'important');
        backBtn.style.setProperty('transform', 'none', 'important');
        backBtn.style.setProperty('z-index', '9999', 'important');
        backBtn.style.setProperty('display', 'inline-flex', 'important');
        backBtn.style.setProperty('align-items', 'center', 'important');
        backBtn.style.setProperty('justify-content', 'center', 'important');
        backBtn.style.setProperty('white-space', 'nowrap', 'important');

        return true;
    }

    function watchFlyerBackButtonPosition() {
        if (forceFlyerBackButtonPosition()) return;

        var retryCount = 0;
        var timer = window.setInterval(function () {
            retryCount += 1;

            if (forceFlyerBackButtonPosition() || retryCount >= 30) {
                window.clearInterval(timer);
            }
        }, 100);
    }


    window.bootFlyerTool = function () {
        /*
            웹전단 진입 기본값은 항상 A4.
            이전 A6 상태가 DOM에 남아 있어도 일반 화면에서는 A4 미리보기가 먼저 떠야 한다.
        */
        setFlyerSizeMode('a4');

        bindInputs();
        loadDraft();

        /*
            loadDraft 이후에도 배경/시안 적용 과정에서 화면 상태가 흔들릴 수 있으니
            한 번 더 A4로 고정한다.
        */
        setFlyerSizeMode('a4');

        updatePreview();

        bindFlyerDescLineEdit();
        bindFlyerA6CardEdit();
        watchFlyerBackButtonPosition();
        watchFlyerMiniMapSnapshot();

        window.requestAnimationFrame(function () {
            setFlyerSizeMode('a4');
            bindFlyerDescLineEdit();
            bindFlyerA6CardEdit();
            watchFlyerBackButtonPosition();
            watchFlyerMiniMapSnapshot();
        });
    };
})();