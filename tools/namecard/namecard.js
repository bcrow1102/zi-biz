(function () {
    'use strict';

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

        return String(el.value || '').trim() || fallback || '';
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

    function cleanPhone(phone) {
        return String(phone || '').replace(/[^\d+]/g, '');
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

        if (!tags.length) {
            tags = ['디지털명함', '빠른공유', 'zimo'];
        }

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

    function makeShareText() {
        var data = getData();
        var website = normalizeUrl(data.website);

        var lines = [
            '[' + data.company + ' 명함]',
            data.name + ' / ' + data.role,
            data.summary,
            '',
            '휴대폰: ' + data.phone
        ];

        if (data.landline) {
            lines.push('대표번호: ' + data.landline);
        }

        if (data.email) {
            lines.push('이메일: ' + data.email);
        }

        if (data.address) {
            lines.push('주소: ' + data.address);
        }

        if (website) {
            lines.push('바로가기: ' + website);
        }

        lines.push('');
        lines.push(data.desc1);
        lines.push(data.desc2);

        return lines.join('\n');
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
            setHelper('명함 링크 문구를 복사했습니다.');
        } catch (error) {
            setHelper('복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
        }

        document.body.removeChild(textarea);
    }

    function copyShareText() {
        var text = makeShareText();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(function () {
                    setHelper('명함 링크 문구를 복사했습니다.');
                })
                .catch(function () {
                    fallbackCopy(text);
                });

            return;
        }

        fallbackCopy(text);
    }

    function downloadVcard() {
        var data = getData();
        var phone = cleanPhone(data.phone);
        var landline = cleanPhone(data.landline);
        var website = normalizeUrl(data.website);

        var vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'N:' + data.name + ';;;;',
            'FN:' + data.name,
            'ORG:' + data.company,
            'TITLE:' + data.role,
            phone ? 'TEL;TYPE=CELL:' + phone : '',
            landline ? 'TEL;TYPE=WORK:' + landline : '',
            data.email ? 'EMAIL:' + data.email : '',
            data.address ? 'ADR;TYPE=WORK:;;' + data.address + ';;;;' : '',
            website ? 'URL:' + website : '',
            'NOTE:' + data.summary + ' ' + data.desc1 + ' ' + data.desc2,
            'END:VCARD'
        ].filter(Boolean).join('\n');

        var blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var fileName = data.name.replace(/\s+/g, '_') + '_namecard.vcf';

        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setHelper('연락처 파일을 저장했습니다.');
    }

    function resetForm() {
        Object.keys(defaults).forEach(function (key) {
            if (els[key]) {
                els[key].value = defaults[key];
            }
        });

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
            els.copyTextBtn.addEventListener('click', copyShareText);
        }

        if (els.saveVcardBtn) {
            els.saveVcardBtn.addEventListener('click', downloadVcard);
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