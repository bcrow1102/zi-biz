(function () {
    'use strict';

    var root = document.getElementById('shareNamecardRoot');

    function getSlug() {
        var params = new URLSearchParams(window.location.search);
        return String(params.get('slug') || '').trim();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeUrl(url) {
        var text = String(url || '').trim();

        if (!text) return '';

        if (/^https?:\/\//i.test(text)) {
            return text;
        }

        return 'https://' + text;
    }

    function splitTags(tagsText) {
        return String(tagsText || '')
            .split(',')
            .map(function (tag) {
                return tag.trim();
            })
            .filter(Boolean)
            .slice(0, 3);
    }

    function showError(message) {
        if (!root) return;

        root.innerHTML =
            '<div class="share-error">' +
            '<strong>명함을 불러오지 못했습니다</strong>' +
            '<p>' + escapeHtml(message || '공유 주소를 다시 확인해 주세요.') + '</p>' +
            '</div>';
    }

    function renderNamecard(card) {
        if (!root) return;

        var template = card.template || card.theme || 'template-red';
        var company = card.company || card.site_name || 'zimo biz';
        var name = card.name || '이름';
        var role = card.position || '직함';
        var summary = card.summary || '';
        var address = card.address || '';
        var phone = card.phone || '';
        var landline = card.tel || '';
        var email = card.email || '';
        var website = normalizeUrl(card.website || '');
        var desc1 = card.desc1 || '';
        var desc2 = card.desc2 || '';
        var tags = splitTags(card.tags);

        if (!desc1 && card.description) {
            var descParts = String(card.description).split('\n');
            desc1 = descParts[0] || '';
            desc2 = descParts.slice(1).join(' ') || '';
        }

        var tagHtml = tags.map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');

        var href = website || '#';

        root.innerHTML =
            '<a class="namecard ' + escapeHtml(template) + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' +
            '<div class="namecard-main">' +
            '<div class="namecard-top">' +
            '<div class="namecard-company">' + escapeHtml(company) + '</div>' +
            '<div class="namecard-person">' +
            '<span class="namecard-role">' + escapeHtml(role) + '</span>' +
            '<strong class="namecard-name">' + escapeHtml(name) + '</strong>' +
            '</div>' +
            '</div>' +

            '<div class="namecard-summary">' + escapeHtml(summary) + '</div>' +
            '<div class="namecard-address">' + escapeHtml(address) + '</div>' +

            '<div class="namecard-contact">' +
            '<div class="namecard-contact-row"><span>Mobile</span><strong>' + escapeHtml(phone) + '</strong></div>' +
            '<div class="namecard-contact-row"><span>Tel</span><strong>' + escapeHtml(landline) + '</strong></div>' +
            '<div class="namecard-contact-row"><span>E-mail</span><strong>' + escapeHtml(email) + '</strong></div>' +
            '</div>' +
            '</div>' +

            '<div class="namecard-desc">' +
            '<strong>' + escapeHtml(desc1) + '</strong>' +
            '<p>' + escapeHtml(desc2) + '</p>' +
            '<div class="namecard-tags">' + tagHtml + '</div>' +
            '</div>' +
            '</a>' +

            '<div class="share-footer">' +
            '<strong>zimo biz</strong> 디지털 명함' +
            '</div>';
    }

    async function loadNamecard() {
        var slug = getSlug();

        if (!slug) {
            showError('공유 slug가 없습니다.');
            return;
        }

        if (!window.ZIMO_SUPABASE_READY || !window.zimoSupabase) {
            showError('Supabase 연결이 준비되지 않았습니다.');
            return;
        }

        var result = await window.zimoSupabase
            .from('namecards')
            .select('*')
            .eq('slug', slug)
            .eq('is_public', true)
            .maybeSingle();

        if (result.error) {
            showError(result.error.message || '명함 조회 중 오류가 발생했습니다.');
            return;
        }

        if (!result.data) {
            showError('공개된 명함을 찾지 못했습니다.');
            return;
        }

        renderNamecard(result.data);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadNamecard);
    } else {
        loadNamecard();
    }
})();