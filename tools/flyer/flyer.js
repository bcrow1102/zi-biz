(function () {
    'use strict';

    var FLYER_DRAFT_KEY = 'zimo_biz_flyer_draft_v2';
    var flyerCustomBgObjectUrl = '';

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
            descInput: document.getElementById('flyerDescInput'),

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
            generalHeroImage: document.getElementById('flyerGeneralHeroImage')
        };
    }

    function getActiveValue(attributeName, fallback) {
        var active = document.querySelector('[' + attributeName + '].is-active');

        if (!active) return fallback;

        return active.getAttribute(attributeName) || fallback;
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
            desc: els.descInput ? els.descInput.value : '',

            manager: els.managerInput ? els.managerInput.value : '',
            phone: els.phoneInput ? els.phoneInput.value : '',

            background: getActiveValue('data-flyer-bg', 'apartment'),
            theme: getActiveValue('data-flyer-theme', 'simple'),
            overlay: getActiveValue('data-flyer-overlay', 'soft')
        };
    }

    function setText(el, value, fallback) {
        if (!el) return;
        el.textContent = safeText(value, fallback);
    }

    function updatePreview() {
        var els = getEls();

        if (!els.preview) return;

        setText(els.previewLabel, els.labelInput && els.labelInput.value, '프리미엄 오피스텔');
        setText(els.previewTitle, els.titleInput && els.titleInput.value, '휴먼블루드빌');
        setText(els.previewCopy, els.copyInput && els.copyInput.value, '울산 시청 옆 수익형 오피스텔');
        setText(els.previewLocation, els.locationInput && els.locationInput.value, '울산 시청 바로 옆');

        setText(els.previewPoint1, els.point1Input && els.point1Input.value, '회사보유분 특별분양');
        setText(els.previewPoint2, els.point2Input && els.point2Input.value, '30% 할인 조건');
        setText(els.previewPoint3, els.point3Input && els.point3Input.value, '4천 전후 실투자금');

        setText(els.previewBenefit, els.benefitInput && els.benefitInput.value, '잔여 호실 특별 조건 안내');
        setText(
            els.previewDesc,
            els.descInput && els.descInput.value,
            '회사보유분 특별 조건은 잔여 호실과 상담 시점에 따라 달라질 수 있습니다. 정확한 내용은 상담을 통해 안내드립니다.'
        );

        setText(els.previewManager, els.managerInput && els.managerInput.value, '김지모 팀장');

        var phoneText = safeText(els.phoneInput && els.phoneInput.value, '010-0000-0000');

        if (els.previewPhone) {
            els.previewPhone.textContent = phoneText;
            els.previewPhone.href = 'tel:' + onlyPhone(phoneText);
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
        if (els.descInput) els.descInput.value = data.desc || '';

        if (els.managerInput) els.managerInput.value = data.manager || '';
        if (els.phoneInput) els.phoneInput.value = data.phone || '';

        setBackground(data.background || 'apartment');
        setTheme(data.theme || 'simple');
        setOverlay(data.overlay || 'soft');

        updatePreview();
    }

    function resetFlyer() {
        var els = getEls();

        var currentBackground = getActiveValue('data-flyer-bg', 'apartment');
        var currentTheme = getActiveValue('data-flyer-theme', 'simple');
        var currentOverlay = getActiveValue('data-flyer-overlay', 'soft');

        if (els.form) {
            els.form.reset();
        }

        try {
            localStorage.removeItem(FLYER_DRAFT_KEY);
        } catch (error) {
            // 삭제 실패 시에도 화면은 초기화한다.
        }

        clearCustomFlyerBackground();

        setBackground(currentBackground);
        setTheme(currentTheme);
        setOverlay(currentOverlay);

        closeDownloadPopover();
        updatePreview();

        showFlyerToast('현재 시안은 유지하고 입력값만 초기화했어.');
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
        var preview = document.getElementById('flyerPreview');

        if (!preview) {
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

            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            await new Promise(function (resolve) {
                requestAnimationFrame(resolve);
            });

            var canvas = await window.html2canvas(preview, {
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
                        element.classList.contains('flyer-theme-menu-list')
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
            var margin = 8;

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
            pdf.save('zimo-biz-flyer.pdf');

            showFlyerToast('PDF 다운로드 완료.');
        } catch (error) {
            console.error('Flyer PDF error:', error);

            var message = error && error.message ? error.message : String(error);
            showFlyerToast('PDF 오류: ' + message.slice(0, 60));
        } finally {
            document.body.classList.remove('is-flyer-pdf-capturing');
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
            els.descInput,
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
        var oldToast = document.querySelector('.tool-action-toast');

        if (oldToast) {
            oldToast.remove();
        }

        var toast = document.createElement('div');
        toast.className = 'tool-action-toast';
        toast.textContent = message;

        document.body.appendChild(toast);

        window.setTimeout(function () {
            toast.classList.add('is-show');
        }, 20);

        window.setTimeout(function () {
            toast.classList.remove('is-show');

            window.setTimeout(function () {
                toast.remove();
            }, 220);
        }, 1800);
    }

    window.bootFlyerTool = function () {
        bindInputs();
        loadDraft();
        updatePreview();
    };
})();