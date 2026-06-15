(function () {
    'use strict';

    var DRAFT_KEY = 'zimo_biz_namecard_draft';
    var SAVED_NAMECARD_KEY = 'zimo_biz_saved_namecard_ref';

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
    function makeNamecardSlug() {
        return 'nc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function getSavedNamecardRef() {
        try {
            var saved = localStorage.getItem(SAVED_NAMECARD_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    }

    function saveNamecardRef(ref) {
        try {
            localStorage.setItem(SAVED_NAMECARD_KEY, JSON.stringify(ref));
        } catch (error) {
            // 저장 실패 시에도 공유 URL 생성은 유지한다.
        }
    }

    function buildNamecardShareUrl(slug) {
        var base = window.location.origin || 'https://지모비즈.com';

        return base + '/n/' + encodeURIComponent(slug);
    }

    async function getCurrentSupabaseUser() {
        if (!window.ZIMO_SUPABASE_READY || !window.zimoSupabase) {
            throw new Error('Supabase 연결이 아직 준비되지 않았습니다.');
        }

        var result = await window.zimoSupabase.auth.getUser();
        var user = result.data && result.data.user;

        if (!user || !user.id) {
            throw new Error('로그인 후 공유 URL을 만들 수 있습니다.');
        }

        return user;
    }

    function makeNamecardRow(data, userId, slug) {
        return {
            user_id: userId,
            slug: slug,

            template: data.template || 'template-red',
            theme: data.template || 'template-red',

            company: data.company || '',
            name: data.name || '',
            position: data.role || '',
            site_name: data.company || '',
            summary: data.summary || '',

            phone: data.phone || '',
            tel: data.landline || '',
            email: data.email || '',
            address: data.address || '',
            website: normalizeUrl(data.website || ''),

            description: [data.desc1 || '', data.desc2 || ''].filter(Boolean).join('\n'),
            desc1: data.desc1 || '',
            desc2: data.desc2 || '',
            tags: data.tags || '',

            is_public: true,
            updated_at: new Date().toISOString()
        };
    }

    function dataUrlToBlob(dataUrl) {
        var parts = dataUrl.split(',');
        var mimeMatch = parts[0].match(/:(.*?);/);
        var mime = mimeMatch ? mimeMatch[1] : 'image/png';
        var binary = atob(parts[1]);
        var length = binary.length;
        var array = new Uint8Array(length);

        for (var i = 0; i < length; i += 1) {
            array[i] = binary.charCodeAt(i);
        }

        return new Blob([array], {
            type: mime
        });
    }

    async function createNamecardOgImage(userId, slug) {
        var card = document.getElementById('ncCard');

        if (!card || !window.html2canvas) {
            return '';
        }

        var canvas = await window.html2canvas(card, {
            backgroundColor: null,
            scale: 2,
            useCORS: true
        });

        var dataUrl = canvas.toDataURL('image/png');
        var blob = dataUrlToBlob(dataUrl);
        var filePath = userId + '/' + slug + '.png';

        var uploadResult = await window.zimoSupabase.storage
            .from('namecard-og')
            .upload(filePath, blob, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadResult.error) {
            throw uploadResult.error;
        }

        var publicResult = window.zimoSupabase.storage
            .from('namecard-og')
            .getPublicUrl(filePath);

        return publicResult.data && publicResult.data.publicUrl
            ? publicResult.data.publicUrl
            : '';
    }

    async function createShareUrl(data) {
        var user = await getCurrentSupabaseUser();
        var savedRef = getSavedNamecardRef();
        var slug = savedRef && savedRef.slug ? savedRef.slug : makeNamecardSlug();
        var row = makeNamecardRow(data, user.id, slug);
        var ogImageUrl = await createNamecardOgImage(user.id, slug);

        if (ogImageUrl) {
            row.og_image_url = ogImageUrl;
        }

        if (savedRef && savedRef.id) {
            var updateResult = await window.zimoSupabase
                .from('namecards')
                .update(row)
                .eq('id', savedRef.id)
                .select('id, slug')
                .maybeSingle();

            if (!updateResult.error && updateResult.data) {
                saveNamecardRef({
                    id: updateResult.data.id,
                    slug: updateResult.data.slug
                });

                return buildNamecardShareUrl(updateResult.data.slug);
            }
        }

        var insertResult = await window.zimoSupabase
            .from('namecards')
            .insert(row)
            .select('id, slug')
            .single();

        if (insertResult.error) {
            throw insertResult.error;
        }

        saveNamecardRef({
            id: insertResult.data.id,
            slug: insertResult.data.slug
        });

        return buildNamecardShareUrl(insertResult.data.slug);
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

        if (els.copyTextBtn) {
            els.copyTextBtn.disabled = true;
            els.copyTextBtn.textContent = '생성 중...';
        }

        setHelper('공유 URL을 생성하고 있습니다.');

        createShareUrl(data)
            .then(function (shareUrl) {
                copyTextToClipboard(shareUrl, '공유 URL을 복사했습니다. 카톡에 붙여넣어 보내세요.');

                if (els.copyTextBtn) {
                    els.copyTextBtn.textContent = '복사 완료';
                }

                window.setTimeout(function () {
                    if (els.copyTextBtn) {
                        els.copyTextBtn.disabled = false;
                        els.copyTextBtn.textContent = '공유 URL 복사';
                    }
                }, 1800);
            })
            .catch(function (error) {
                setHelper(error.message || '공유 URL 생성에 실패했습니다.');

                if (els.copyTextBtn) {
                    els.copyTextBtn.disabled = false;
                    els.copyTextBtn.textContent = '공유 URL 복사';
                }
            });
    }

    function updateTemplate(templateName) {
        if (!els.card) return;

        els.card.classList.remove('template-red', 'template-blue', 'template-gold');
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
        var currentTemplate = defaults.template;

        if (els.template && els.template.value) {
            currentTemplate = els.template.value;
        }

        Object.keys(defaults).forEach(function (key) {
            if (!els[key]) return;

            if (key === 'template') {
                els[key].value = currentTemplate;
                return;
            }

            els[key].value = defaults[key];
        });

        try {
            var data = getData();
            data.template = currentTemplate;
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        } catch (error) {
            // 저장 실패 시에도 초기화 화면은 유지한다.
        }

        updatePreview();

        var mirror = document.getElementById('namecardPreviewTemplateSelect');

        if (mirror) {
            mirror.value = currentTemplate;
        }

        var websiteMirror = document.getElementById('namecardWebsiteTopInput');

        if (websiteMirror && els.website) {
            websiteMirror.value = els.website.value || '';
        }

        var editInput = document.getElementById('namecardEditInput');
        var editCount = document.getElementById('namecardEditCount');
        var selectedTarget = document.querySelector('#namecardTool .namecard-edit-target.is-namecard-selected');
        var selectedField = selectedTarget ? selectedTarget.getAttribute('data-namecard-field') : '';

        if (editInput && selectedField && els[selectedField]) {
            editInput.value = els[selectedField].value || '';

            if (editCount && editInput.maxLength && editInput.maxLength > 0) {
                editCount.textContent = String(editInput.value.length) + '/' + String(editInput.maxLength);
            }
        }

        setHelper('현재 시안 기준으로 초기화했습니다.');
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
/* =========================================================
   NAMECARD DIRECT EDIT FINAL
   - 명함 미리보기 직접 클릭 수정
   - 미니맵 없음
   - 기존 입력폼은 데이터 저장용으로만 유지
========================================================= */

(function () {
    'use strict';

    var selectedKey = null;

    var EDIT_FIELDS = [
        {
            key: 'company',
            label: '현장명 / 회사명',
            inputId: 'ncCompany',
            previewId: 'ncPreviewCompany',
            placeholder: '예시) 문수로 써밋 블루밍',
            maxLength: 18
        },
        {
            key: 'role',
            label: '직함',
            inputId: 'ncRole',
            previewId: 'ncPreviewRole',
            placeholder: '예시) 팀장',
            maxLength: 8
        },
        {
            key: 'name',
            label: '이름',
            inputId: 'ncName',
            previewId: 'ncPreviewName',
            placeholder: '예시) 김지모',
            maxLength: 8
        },
        {
            key: 'summary',
            label: '한 줄 소개',
            inputId: 'ncSummary',
            previewId: 'ncPreviewSummary',
            placeholder: '예시) 울산 신규 아파트 상담 안내',
            maxLength: 24
        },
        {
            key: 'address',
            label: '주소',
            inputId: 'ncAddress',
            previewId: 'ncPreviewAddress',
            placeholder: '예시) 울산 남구 삼산로 00',
            maxLength: 28
        },
        {
            key: 'phone',
            label: '휴대폰',
            inputId: 'ncPhone',
            previewId: 'ncPreviewPhone',
            placeholder: '예시) 010-0000-0000',
            maxLength: 16
        },
        {
            key: 'landline',
            label: '대표번호',
            inputId: 'ncLandline',
            previewId: 'ncPreviewLandline',
            placeholder: '예시) 052-000-0000',
            maxLength: 16
        },
        {
            key: 'email',
            label: '이메일',
            inputId: 'ncEmail',
            previewId: 'ncPreviewEmail',
            placeholder: '예시) hello@zimo.kr',
            maxLength: 32
        },
        {
            key: 'desc1',
            label: '설명 1줄',
            inputId: 'ncDesc1',
            previewId: 'ncPreviewDesc1',
            placeholder: '예시) 울산 신규 아파트 상담 안내',
            maxLength: 28
        },
        {
            key: 'desc2',
            label: '설명 2줄',
            inputId: 'ncDesc2',
            previewId: 'ncPreviewDesc2',
            placeholder: '예시) 분양 조건, 혜택, 방문 예약을 빠르게 안내드립니다.',
            maxLength: 42
        },
        {
            key: 'tags',
            label: '태그 3개',
            inputId: 'ncTags',
            previewId: 'ncPreviewTags',
            placeholder: '예시) 현장상담, 조건안내, 방문예약',
            maxLength: 28
        }
    ];

    function $(id) {
        return document.getElementById(id);
    }

    function getTool() {
        return $('namecardTool');
    }

    function getField(key) {
        return EDIT_FIELDS.find(function (field) {
            return field.key === key;
        });
    }

    function getInput(key) {
        var field = getField(key);
        return field ? $(field.inputId) : null;
    }

    function getPreview(key) {
        var field = getField(key);
        return field && field.previewId ? $(field.previewId) : null;
    }

    function getInputValue(key) {
        var input = getInput(key);
        return input ? String(input.value || '') : '';
    }

    function setInputValue(key, value) {
        var input = getInput(key);

        if (!input) return;

        input.value = value;

        input.dispatchEvent(new Event('input', {
            bubbles: true
        }));

        input.dispatchEvent(new Event('change', {
            bubbles: true
        }));
    }


    function createInlineEditor(tool) {
        var existing = $('namecardEditBar');

        if (existing) return existing;

        var editBar = document.createElement('div');
        editBar.className = 'namecard-edit-bar';
        editBar.id = 'namecardEditBar';

        editBar.innerHTML = '' +
            '<div class="namecard-edit-bar-label">' +
            '   <span id="namecardEditLabel">항목 선택</span>' +
            '   <small id="namecardEditCount">0/0</small>' +
            '</div>' +
            '<input type="text" class="namecard-edit-input" id="namecardEditInput" placeholder="명함 문구를 선택해 주세요" disabled />' +
            '<button type="button" class="namecard-edit-reset" id="namecardEditClearBtn" aria-label="선택 항목 비우기">×</button>';

        var previewArea = tool.querySelector('.namecard-preview-area');
        var actions = tool.querySelector('.namecard-actions');

        if (previewArea && actions) {
            previewArea.insertBefore(editBar, actions);
        } else if (previewArea) {
            previewArea.appendChild(editBar);
        } else {
            tool.appendChild(editBar);
        }

        return editBar;
    }

    function markEditTargets() {
        EDIT_FIELDS.forEach(function (field) {
            var preview = getPreview(field.key);

            if (!preview || preview.dataset.namecardEditTarget === 'true') return;

            preview.dataset.namecardEditTarget = 'true';
            preview.dataset.namecardField = field.key;
            preview.classList.add('namecard-edit-target');
            preview.setAttribute('tabindex', '0');
            preview.setAttribute('role', 'button');
            preview.setAttribute('title', field.label + ' 수정');
        });
    }

    function updatePreviewSelected(key) {
        var tool = getTool();

        if (tool) {
            Array.prototype.forEach.call(
                tool.querySelectorAll('.is-namecard-selected'),
                function (el) {
                    el.classList.remove('is-namecard-selected');
                }
            );
        }

        EDIT_FIELDS.forEach(function (field) {
            var preview = getPreview(field.key);

            if (preview && field.key === key) {
                preview.classList.add('is-namecard-selected');
            }
        });
    }


    function updateEditor(key) {
        var field = getField(key);
        var input = $('namecardEditInput');
        var label = $('namecardEditLabel');
        var count = $('namecardEditCount');
        var title = $('namecardSelectedTitle');

        if (!field || !input || !label || !count) return;

        selectedKey = key;

        var value = getInputValue(key);

        input.disabled = false;
        input.value = value;
        input.placeholder = field.placeholder;
        input.maxLength = field.maxLength;

        label.textContent = field.label;
        count.textContent = String(value.length) + '/' + String(field.maxLength);

        if (title) {
            title.textContent = field.label;
        }

        updatePreviewSelected(key);

        window.setTimeout(function () {
            input.focus();
            input.select();
        }, 0);
    }

    function selectField(key) {
        if (!getField(key)) return;
        updateEditor(key);
    }

    function bindPreviewSelect(tool) {
        if (tool.dataset.namecardPreviewSelectBound === 'true') return;

        tool.dataset.namecardPreviewSelectBound = 'true';

        tool.addEventListener('click', function (event) {
            var target = event.target.closest('.namecard-edit-target');

            if (!target || !tool.contains(target)) return;

            event.preventDefault();
            event.stopPropagation();

            selectField(target.getAttribute('data-namecard-field'));
        });

        tool.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            var target = event.target.closest('.namecard-edit-target');

            if (!target || !tool.contains(target)) return;

            event.preventDefault();

            selectField(target.getAttribute('data-namecard-field'));
        });
    }


    function bindEditorInput() {
        var input = $('namecardEditInput');
        var clearBtn = $('namecardEditClearBtn');

        if (input && input.dataset.namecardEditInputBound !== 'true') {
            input.dataset.namecardEditInputBound = 'true';

            input.addEventListener('input', function () {
                var field = getField(selectedKey);
                var count = $('namecardEditCount');

                if (!field) return;

                setInputValue(selectedKey, input.value);

                if (count) {
                    count.textContent = String(input.value.length) + '/' + String(field.maxLength);
                }
            });
        }

        if (clearBtn && clearBtn.dataset.namecardClearBound !== 'true') {
            clearBtn.dataset.namecardClearBound = 'true';

            clearBtn.addEventListener('click', function () {
                var input = $('namecardEditInput');

                if (!selectedKey || !input) return;

                input.value = '';
                input.dispatchEvent(new Event('input', {
                    bubbles: true
                }));
                input.focus();
            });
        }
    }

    function bindTemplateMini() {
        var template = $('ncTemplate');

        if (!template || template.dataset.namecardTemplateMiniBound === 'true') return;

        template.dataset.namecardTemplateMiniBound = 'true';

        template.addEventListener('change', function () {
            var label = document.querySelector('.namecard-template-current');

            if (label) {
                label.textContent = template.options[template.selectedIndex].textContent || '시안 1';
            }
        });
    }


    function moveTemplateSelectToPreview(tool) {
        var template = $('ncTemplate');
        var website = $('ncWebsite');
        var previewTop = tool.querySelector('.namecard-preview-top');
        var resetBtn = $('ncResetBtn');
        var actions = tool.querySelector('.namecard-actions');

        if (!template || !previewTop) return;

        var toolbar = $('namecardPreviewToolbar');

        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.className = 'namecard-preview-toolbar';
            toolbar.id = 'namecardPreviewToolbar';
            previewTop.appendChild(toolbar);
        }

        if (website && !$('namecardWebsiteTopField')) {
            var websiteWrap = document.createElement('label');
            websiteWrap.className = 'namecard-website-top-field';
            websiteWrap.id = 'namecardWebsiteTopField';

            websiteWrap.innerHTML = '' +
                '<span>연결 주소 입력</span>' +
                '<input type="url" id="namecardWebsiteTopInput" placeholder="예시) https://www.zimo.kr" />';

            toolbar.insertBefore(websiteWrap, toolbar.firstChild);

            var websiteMirror = $('namecardWebsiteTopInput');

            websiteMirror.value = website.value || '';

            websiteMirror.addEventListener('input', function () {
                website.value = websiteMirror.value;

                website.dispatchEvent(new Event('input', {
                    bubbles: true
                }));

                website.dispatchEvent(new Event('change', {
                    bubbles: true
                }));
            });

            website.addEventListener('input', function () {
                if (websiteMirror.value !== website.value) {
                    websiteMirror.value = website.value || '';
                }
            });

            website.addEventListener('change', function () {
                if (websiteMirror.value !== website.value) {
                    websiteMirror.value = website.value || '';
                }
            });
        }
        var websiteEditBtn = $('namecardWebsiteEditBtn');

        if (websiteEditBtn) {
            websiteEditBtn.remove();
        }

        var saveInputBtn = $('ncSaveVcardBtn');

        if (saveInputBtn) {
            saveInputBtn.remove();
        }

        if (!$('namecardPreviewTemplateControl')) {
            var previewScene = tool.querySelector('.namecard-preview-scene');

            if (previewScene) {
                var wrap = document.createElement('label');
                wrap.className = 'namecard-preview-template-control namecard-preview-template-control--inside';
                wrap.id = 'namecardPreviewTemplateControl';

                wrap.innerHTML = '' +
                    '<span>시안 선택</span>' +
                    '<select id="namecardPreviewTemplateSelect">' +
                    '   <option value="template-red">시안 1</option>' +
                    '   <option value="template-blue">시안 2</option>' +
                    '   <option value="template-gold">시안 3</option>' +
                    '</select>';

                previewScene.appendChild(wrap);

                var mirror = $('namecardPreviewTemplateSelect');

                mirror.value = template.value || 'template-red';

                mirror.addEventListener('change', function () {
                    template.value = mirror.value;

                    template.dispatchEvent(new Event('change', {
                        bubbles: true
                    }));
                });

                template.addEventListener('change', function () {
                    mirror.value = template.value || 'template-red';
                });
            }
        }

        if (resetBtn && !resetBtn.classList.contains('is-in-namecard-toolbar')) {
            resetBtn.classList.add('is-in-namecard-toolbar');
            toolbar.appendChild(resetBtn);
        }

        if (actions && !actions.classList.contains('is-in-namecard-toolbar')) {
            actions.classList.add('is-in-namecard-toolbar');
            toolbar.appendChild(actions);
        }
    }

    function bootDirectNamecardEdit() {
        var tool = getTool();

        if (!tool) return;

        tool.classList.add('is-namecard-direct-final');

        createInlineEditor(tool);
        moveTemplateSelectToPreview(tool);

        markEditTargets();
        bindPreviewSelect(tool);
        bindEditorInput();
        bindTemplateMini();

        if (!selectedKey) {
            selectField('name');
        }
    }

    var previousBoot = window.bootNamecardTool;

    window.bootNamecardTool = function () {
        if (typeof previousBoot === 'function') {
            previousBoot();
        }

        window.setTimeout(bootDirectNamecardEdit, 0);
    };

    document.addEventListener('DOMContentLoaded', function () {
        window.setTimeout(bootDirectNamecardEdit, 0);
    });

    document.addEventListener('click', function (event) {
        if (!event.target.closest('[data-tool="namecard"]')) return;

        window.setTimeout(bootDirectNamecardEdit, 250);
    });
})();

/* =========================================================
   NAMECARD TAG EACH EDIT FINAL
   - 하단 설명 태그를 버튼 하나씩 직접 수정
   - ncTags 값은 내부적으로 콤마 문자열 유지
========================================================= */

(function () {
    'use strict';

    var activeTagIndex = null;

    function $(id) {
        return document.getElementById(id);
    }

    function cleanExampleText(value, fallback) {
        var text = String(value || '').trim();

        if (!text) return fallback || '';

        return text.replace(/^예시\)\s*/g, '').trim() || fallback || '';
    }

    function getTagInputValue() {
        var input = $('ncTags');

        if (!input) return '현장상담, 조건안내, 방문예약';

        var value = String(input.value || '').trim();

        if (value) return value;

        return cleanExampleText(input.getAttribute('placeholder'), '현장상담, 조건안내, 방문예약');
    }

    function getTags() {
        var tags = getTagInputValue()
            .split(',')
            .map(function (tag) {
                return tag.trim();
            })
            .filter(Boolean)
            .slice(0, 3);

        while (tags.length < 3) {
            tags.push('');
        }

        return tags;
    }

    function setTags(tags) {
        var input = $('ncTags');

        if (!input) return;

        input.value = tags
            .map(function (tag) {
                return String(tag || '').trim();
            })
            .filter(Boolean)
            .join(', ');

        input.dispatchEvent(new Event('input', {
            bubbles: true
        }));

        input.dispatchEvent(new Event('change', {
            bubbles: true
        }));
    }

    function markTagButtons() {
        var wrap = $('ncPreviewTags');

        if (!wrap) return;

        /* 전체 태그 영역이 아니라, 태그 하나하나만 선택되게 */
        wrap.classList.remove('namecard-edit-target');
        wrap.removeAttribute('data-namecard-field');
        wrap.removeAttribute('tabindex');
        wrap.removeAttribute('role');
        wrap.removeAttribute('title');

        Array.prototype.forEach.call(wrap.querySelectorAll('span'), function (span, index) {
            span.classList.add('namecard-tag-edit-target');
            span.dataset.namecardTagIndex = String(index);
            span.setAttribute('tabindex', '0');
            span.setAttribute('role', 'button');
            span.setAttribute('title', '태그 ' + String(index + 1) + ' 수정');
        });
    }

    function markActiveTag(index) {
        var wrap = $('ncPreviewTags');
        var tool = $('namecardTool');

        /* 일반 입력 항목 선택 표시 먼저 전부 제거 */
        if (tool) {
            Array.prototype.forEach.call(
                tool.querySelectorAll('.namecard-edit-target.is-namecard-selected'),
                function (el) {
                    el.classList.remove('is-namecard-selected');
                }
            );
        }

        if (!wrap) return;

        /* 태그는 선택한 태그 하나만 표시 */
        Array.prototype.forEach.call(wrap.querySelectorAll('span'), function (span, spanIndex) {
            span.classList.toggle('is-namecard-selected', spanIndex === index);
        });
    }

    function selectTag(index) {
        var tags = getTags();
        var editInput = $('namecardEditInput');
        var editLabel = $('namecardEditLabel');
        var editCount = $('namecardEditCount');

        if (!editInput || !editLabel || !editCount) return;

        activeTagIndex = index;

        editLabel.textContent = '태그 ' + String(index + 1);
        editInput.disabled = false;
        editInput.value = tags[index] || '';
        editInput.placeholder = '예시) 현장상담';
        editInput.maxLength = 10;
        editCount.textContent = String(editInput.value.length) + '/10';

        markActiveTag(index);

        window.setTimeout(function () {
            editInput.focus();
            editInput.select();
        }, 0);
    }

    document.addEventListener('click', function (event) {
        var tag = event.target.closest('#ncPreviewTags span');

        if (!tag) {
            if (event.target.closest('.namecard-edit-target')) {
                activeTagIndex = null;
            }

            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        markTagButtons();

        var index = Number(tag.dataset.namecardTagIndex || '0');

        selectTag(index);
    }, true);

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        var tag = event.target.closest('#ncPreviewTags span');

        if (!tag) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        var index = Number(tag.dataset.namecardTagIndex || '0');

        selectTag(index);
    }, true);

    document.addEventListener('input', function (event) {
        var editInput = $('namecardEditInput');

        if (!editInput || event.target !== editInput) return;
        if (activeTagIndex === null) return;

        event.stopImmediatePropagation();

        var tags = getTags();
        var editCount = $('namecardEditCount');

        tags[activeTagIndex] = editInput.value;

        setTags(tags);

        if (editCount) {
            editCount.textContent = String(editInput.value.length) + '/10';
        }

        window.setTimeout(function () {
            markTagButtons();
            markActiveTag(activeTagIndex);
        }, 0);
    }, true);

    document.addEventListener('DOMContentLoaded', function () {
        window.setTimeout(markTagButtons, 300);
    });

    document.addEventListener('input', function (event) {
        if (!event.target.closest('#namecardTool')) return;

        window.setTimeout(markTagButtons, 0);
    }, true);

    document.addEventListener('change', function (event) {
        if (!event.target.closest('#namecardTool')) return;

        window.setTimeout(markTagButtons, 0);
    }, true);

    window.setInterval(function () {
        if ($('namecardTool')) {
            markTagButtons();
        }
    }, 800);
})();
/* =========================================================
   NAMECARD EDIT MODE LINK BLOCK FINAL
   - 편집 화면에서는 명함 카드 클릭 시 연결주소 이동 방지
   - 카톡/문자 공유용 실제 페이지에서는 링크 사용 가능
========================================================= */

(function () {
    'use strict';

    function isNamecardEditMode() {
        var tool = document.getElementById('namecardTool');

        return !!(
            tool &&
            tool.classList.contains('is-namecard-direct-final')
        );
    }

    function blockEditModeCardLink(event) {
        if (!isNamecardEditMode()) return;

        var card = event.target.closest('#ncCard');

        if (!card) return;

        /* 편집 화면에서는 링크 이동만 막고, 텍스트 선택 클릭은 계속 전달 */
        event.preventDefault();
    }

    document.addEventListener('click', blockEditModeCardLink, true);
    document.addEventListener('dblclick', blockEditModeCardLink, true);
})();
