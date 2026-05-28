(function () {
    'use strict';

    var DRAFT_KEY = 'zimo_biz_namecard_draft';

    var defaults = {
        template: 'template-red',
        company: 'zimo biz',
        name: '김지모',
        role: '팀장',
        summary: '울산 부동산·분양 상담',
        phone: '010-0000-0000',
        landline: '052-000-0000',
        email: 'hello@zimo.kr',
        address: '울산 남구 삼산로 00',
        website: 'https://www.zimo.kr',
        desc1: '명함을 누르면 상세 안내 페이지로 바로 연결됩니다.',
        desc2: '카카오톡·문자 공유용 링크로 사용할 수 있습니다.',
        tags: '분양상담, 상세안내, 바로연결'
    };

    var els = {};

    function $(id) {
        return document.getElementById(id);
    }

    function collectEls() {
        els = {
            template: $('ncTemplate'),
            company: $('ncCompany'),
            name: $('ncName'),
            role: $('ncRole'),
            summary: $('ncSummary'),
            phone: $('ncPhone'),
            landline: $('ncLandline'),
            email: $('ncEmail'),
            address: $('ncAddress'),
            website: $('ncWebsite'),
            desc1: $('ncDesc1'),
            desc2: $('ncDesc2'),
            tags: $('ncTags'),

            card: $('ncCard'),
            previewCompany: $('ncPreviewCompany'),
            previewName: $('ncPreviewName'),
            previewRole: $('ncPreviewRole'),
            previewSummary: $('ncPreviewSummary'),
            previewAddress: $('ncPreviewAddress'),
            previewPhone: $('ncPreviewPhone'),
            previewLandline: $('ncPreviewLandline'),
            previewEmail: $('ncPreviewEmail'),
            previewDesc1: $('ncPreviewDesc1'),
            previewDesc2: $('ncPreviewDesc2'),
            previewTags: $('ncPreviewTags'),

            copyTextBtn: $('ncCopyTextBtn'),
            saveVcardBtn: $('ncSaveVcardBtn'),
            resetBtn: $('ncResetBtn'),
            helperText: $('ncHelperText')
        };
    }

    function value(key, fallback) {
        var el = els[key];

        if (!el) {
            return fallback || '';
        }

        return String(el.value || '').trim();
    }

    function setText(el, text) {
        if (!el) return;
        el.textContent = text || '';
    }

    function normalizeUrl(url) {
        var text = String(url || '').trim();

        if (!text) return '';

        if (/^https?:\/\//i.test(text)) {
            return text;
        }

        return 'https://' + text;
    }

    function setHelper(message) {
        if (!els.helperText) return;

        els.helperText.textContent = message || '입력값은 현재 브라우저에서만 미리보기 됩니다.';

        window.clearTimeout(setHelper.timer);
        setHelper.timer = window.setTimeout(function () {
            if (els.helperText) {
                els.helperText.textContent = '입력값은 현재 브라우저에서만 미리보기 됩니다.';
            }
        }, 2600);
    }

    function getData() {
        return {
            template: value('template', defaults.template),
            company: value('company', defaults.company),
            name: value('name', defaults.name),
            role: value('role', defaults.role),
            summary: value('summary', defaults.summary),
            phone: value('phone', defaults.phone),
            landline: value('landline', defaults.landline),
            email: value('email', defaults.email),
            address: value('address', defaults.address),
            website: value('website', defaults.website),
            desc1: value('desc1', defaults.desc1),
            desc2: value('desc2', defaults.desc2),
            tags: value('tags', defaults.tags)
        };
    }
    function getEmptyFields(data) {
        var fieldLabels = {
            company: '현장명 / 회사명',
            name: '이름',
            role: '직함',
            summary: '한 줄 소개',
            phone: '휴대폰',
            landline: '대표번호',
            email: '이메일',
            address: '주소',
            website: '연결 주소',
            desc1: '설명 1줄',
            desc2: '설명 2줄',
            tags: '태그 3개'
        };

        return Object.keys(fieldLabels)
            .filter(function (key) {
                return !String(data[key] || '').trim();
            })
            .map(function (key) {
                return fieldLabels[key];
            });
    }

    function confirmEmptyFields(emptyFields) {
        if (!emptyFields.length) {
            return true;
        }

        var message =
            '입력되지 않은 항목이 있습니다.\n\n' +
            emptyFields.map(function (label) {
                return '- ' + label;
            }).join('\n') +
            '\n\n그래도 공유 명함을 생성할까요?';

        return window.confirm(message);
    }

    function copyTextToClipboard(text, successMessage) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(function () {
                    setHelper(successMessage || '복사했습니다.');
                })
                .catch(function () {
                    fallbackCopy(text);
                });

            return;
        }

        fallbackCopy(text);
    }

    /*
        나중에 Supabase 붙이면 이 함수만 바꾸면 됨.
    
        최종 동작:
        1. Supabase에 data 저장
        2. namecard id 받기
        3. 공유 URL 만들기
        4. OG 이미지 생성/연결
        5. 공유 URL 반환
    */
    function createShareUrl(data) {
        // 현재 임시 버전: Supabase 연결 전이라 입력된 연결 주소를 공유 URL처럼 사용
        var url = normalizeUrl(data.website);

        if (!url) {
            url = window.location.origin || 'https://지모비즈.com';
        }

        return Promise.resolve(url);
    }

    function handleShareUrlCopy() {
        var data = getData();
        var emptyFields = getEmptyFields(data);

        if (!confirmEmptyFields(emptyFields)) {
            setHelper('공유 생성을 취소했습니다.');
            return;
        }

        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        } catch (error) {
            // 임시저장 실패해도 공유 생성 흐름은 계속 진행
        }

        setHelper('공유 URL을 생성하고 있습니다.');

        createShareUrl(data)
            .then(function (shareUrl) {
                copyTextToClipboard(shareUrl, '공유 URL을 복사했습니다. 카톡에 붙여넣어 보내세요.');
            })
            .catch(function () {
                setHelper('공유 URL 생성에 실패했습니다.');
            });
    }

    function updateTemplate(templateName) {
        if (!els.card) return;

        els.card.classList.remove('template-red', 'template-blue');
        els.card.classList.add(templateName || defaults.template);
    }

    function updateCompanySize(companyText) {
        if (!els.previewCompany) return;

        var length = String(companyText || '').replace(/\s/g, '').length;

        els.previewCompany.classList.remove('is-long', 'is-very-long');

        if (length >= 11) {
            els.previewCompany.classList.add('is-very-long');
        } else if (length >= 7) {
            els.previewCompany.classList.add('is-long');
        }
    }

    function updateCardLink(website) {
        if (!els.card) return;

        var url = normalizeUrl(website);

        if (url) {
            els.card.href = url;
            els.card.target = '_blank';
            els.card.rel = 'noopener';
        } else {
            els.card.href = '#';
            els.card.removeAttribute('target');
            els.card.removeAttribute('rel');
        }
    }

    function renderTags(tagsText) {
        if (!els.previewTags) return;

        var tags = String(tagsText || '')
            .split(',')
            .map(function (tag) {
                return tag.trim();
            })
            .filter(Boolean)
            .slice(0, 3);



        els.previewTags.innerHTML = '';

        tags.forEach(function (tag) {
            var span = document.createElement('span');
            span.textContent = tag;
            els.previewTags.appendChild(span);
        });
    }

    function updatePreview() {
        var data = getData();

        setText(els.previewCompany, data.company);
        setText(els.previewName, data.name);
        setText(els.previewRole, data.role);
        setText(els.previewSummary, data.summary);
        setText(els.previewAddress, data.address);
        setText(els.previewPhone, data.phone);
        setText(els.previewLandline, data.landline);
        setText(els.previewEmail, data.email);
        setText(els.previewDesc1, data.desc1);
        setText(els.previewDesc2, data.desc2);

        updateTemplate(data.template);
        updateCompanySize(data.company);
        updateCardLink(data.website);
        renderTags(data.tags);
    }

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');

        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';

        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            setHelper('공유 URL을 복사했습니다.');
        } catch (error) {
            setHelper('복사에 실패했습니다. 브라우저 권한을 확인해줘.');
        }

        document.body.removeChild(textarea);
    }

    function copyShareText() {
        var data = getData();
        var url = normalizeUrl(data.website);

        if (!url) {
            setHelper('복사할 연결 주소를 입력해줘.');
            if (els.website) els.website.focus();
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
                .then(function () {
                    setHelper('공유 URL을 복사했습니다.');
                })
                .catch(function () {
                    fallbackCopy(url);
                });

            return;
        }

        fallbackCopy(url);
    }

    function saveDraft() {
        var data = getData();

        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            setHelper('입력내용을 저장했습니다.');
        } catch (error) {
            setHelper('저장에 실패했습니다. 브라우저 저장공간을 확인해줘.');
        }
    }

    function loadSavedDraft() {
        var saved = null;

        try {
            saved = localStorage.getItem(DRAFT_KEY);
        } catch (error) {
            saved = null;
        }

        if (!saved) return;

        try {
            var data = JSON.parse(saved);

            Object.keys(defaults).forEach(function (key) {
                if (els[key] && Object.prototype.hasOwnProperty.call(data, key)) {
                    els[key].value = data[key];
                }
            });
        } catch (error) {
            // 저장값이 깨졌으면 무시한다.
        }
    }

    function resetForm() {
        Object.keys(defaults).forEach(function (key) {
            if (els[key]) {
                els[key].value = defaults[key];
            }
        });

        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
            // 삭제 실패 시에도 초기화 화면은 유지한다.
        }

        updatePreview();
        setHelper('기본 예시값으로 초기화했습니다.');
    }

    function bindEvents() {
        [
            'template',
            'company',
            'name',
            'role',
            'summary',
            'phone',
            'landline',
            'email',
            'address',
            'website',
            'desc1',
            'desc2',
            'tags'
        ].forEach(function (key) {
            if (!els[key]) return;

            var eventName = els[key].tagName === 'SELECT' ? 'change' : 'input';
            els[key].addEventListener(eventName, updatePreview);
        });

        if (els.copyTextBtn) {
            els.copyTextBtn.addEventListener('click', handleShareUrlCopy);
        }

        if (els.saveVcardBtn) {
            els.saveVcardBtn.addEventListener('click', saveDraft);
        }

        if (els.resetBtn) {
            els.resetBtn.addEventListener('click', resetForm);
        }
    }

    function bootNamecardTool() {
        collectEls();

        if (!$('namecardTool')) {
            return;
        }

        loadSavedDraft();
        bindEvents();
        updatePreview();
    }

    window.bootNamecardTool = bootNamecardTool;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootNamecardTool);
    } else {
        bootNamecardTool();
    }
})();
/* =========================================================
   NAMECARD EMPTY INPUT PREVIEW FALLBACK
   - input value가 비어 있어도 placeholder 예시값으로 미리보기 유지
   - 예시 문구는 입력칸에만 흐리게 보이고, 명함은 깨지지 않게 함
========================================================= */

(function () {
    function cleanExampleText(value, fallback) {
        var text = String(value || '').trim();

        if (!text) return fallback || '';

        return text.replace(/^예시\)\s*/g, '').trim() || fallback || '';
    }

    function getInputPreviewValue(inputId, fallback) {
        var input = document.getElementById(inputId);

        if (!input) return fallback || '';

        var value = String(input.value || '').trim();

        if (value) return value;

        return cleanExampleText(input.getAttribute('placeholder'), fallback);
    }

    function setPreviewText(previewId, text) {
        var el = document.getElementById(previewId);

        if (!el) return;

        el.textContent = text || '';
    }

    function syncNamecardPreviewFallback() {
        var tool = document.getElementById('namecardTool');

        if (!tool) return;

        var company = getInputPreviewValue('ncCompany', 'zimo biz');
        var role = getInputPreviewValue('ncRole', '팀장');
        var name = getInputPreviewValue('ncName', '김지모');
        var summary = getInputPreviewValue('ncSummary', '울산 신규 아파트 상담 안내');
        var address = getInputPreviewValue('ncAddress', '울산 남구 삼산로 00');
        var phone = getInputPreviewValue('ncPhone', '010-0000-0000');
        var landline = getInputPreviewValue('ncLandline', '052-000-0000');
        var email = getInputPreviewValue('ncEmail', 'hello@zimo.kr');
        var website = getInputPreviewValue('ncWebsite', 'https://www.zimo.kr');

        var desc1 = getInputPreviewValue('ncDesc1', '울산 신규 아파트 상담 안내');
        var desc2 = getInputPreviewValue('ncDesc2', '분양 조건, 혜택, 방문 예약을 빠르게 안내드립니다.');
        var tags = getInputPreviewValue('ncTags', '현장상담, 조건안내, 방문예약');

        setPreviewText('ncPreviewCompany', company);
        setPreviewText('ncPreviewRole', role);
        setPreviewText('ncPreviewName', name);
        setPreviewText('ncPreviewSummary', summary);
        setPreviewText('ncPreviewAddress', address);
        setPreviewText('ncPreviewPhone', phone);
        setPreviewText('ncPreviewLandline', landline);
        setPreviewText('ncPreviewEmail', email);
        setPreviewText('ncPreviewDesc1', desc1);
        setPreviewText('ncPreviewDesc2', desc2);

        var card = document.getElementById('ncCard');

        if (card) {
            card.href = website || 'https://www.zimo.kr';
        }

        var tagWrap = document.getElementById('ncPreviewTags');

        if (tagWrap) {
            tagWrap.innerHTML = '';

            tags.split(',')
                .map(function (tag) {
                    return tag.trim();
                })
                .filter(Boolean)
                .slice(0, 3)
                .forEach(function (tag) {
                    var span = document.createElement('span');
                    span.textContent = tag;
                    tagWrap.appendChild(span);
                });
        }

        var companyEl = document.getElementById('ncPreviewCompany');

        if (companyEl) {
            companyEl.classList.toggle('is-long', company.length >= 8 && company.length < 12);
            companyEl.classList.toggle('is-very-long', company.length >= 12);
        }
    }

    document.addEventListener('input', function (event) {
        if (!event.target.closest('#namecardTool')) return;

        window.setTimeout(syncNamecardPreviewFallback, 0);
    }, true);

    document.addEventListener('change', function (event) {
        if (!event.target.closest('#namecardTool')) return;

        window.setTimeout(syncNamecardPreviewFallback, 0);
    }, true);

    var oldBootNamecardTool = window.bootNamecardTool;

    window.bootNamecardTool = function () {
        if (typeof oldBootNamecardTool === 'function') {
            oldBootNamecardTool();
        }

        window.setTimeout(syncNamecardPreviewFallback, 0);
    };
})();