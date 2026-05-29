(function () {
    'use strict';

    var STORAGE_KEY = 'zimo_biz_temp_user';
    var USERS_KEY = 'zimo_biz_temp_users';
    var NOTICE_READ_KEY = 'zimo_biz_notice_read_ids';
    var FEEDBACK_KEY = 'zimo_biz_beta_feedback_items';
    var FEEDBACK_LIKES_KEY = 'zimo_biz_beta_feedback_likes';

    var notices = [
        {
            id: 'zimo-biz-guide-2026-05-24',
            title: '지모비즈 베타 안내'
        }
    ];

    var state = {
        currentView: 'home',
        gold: 10000,
        user: null,
        pendingProvider: '',
        nicknameChecked: false,
        checkedNickname: '',
        feedbackSort: 'latest',
        feedbackCategory: 'feature',
        feedbackVisibleCount: 5
    };

    var views = {
        home: document.getElementById('viewHome'),
        broker: document.getElementById('viewBroker'),
        site: document.getElementById('viewSite'),
        tools: document.getElementById('viewTools'),
        feedback: document.getElementById('viewFeedback'),
        more: document.getElementById('viewMore')
    };

    var els = {
        goldAmount: document.getElementById('goldAmount'),
        goldPill: document.getElementById('goldPill'),
        toolPanel: document.getElementById('toolPanel'),

        loginBtn: document.getElementById('loginBtn'),
        loginBtnLabel: document.getElementById('loginBtnLabel'),
        userAvatar: document.getElementById('userAvatar'),
        logoutBtn: document.getElementById('logoutBtn'),

        noticeBtn: document.getElementById('noticeBtn'),
        noticeCount: document.getElementById('noticeCount'),
        noticePopover: document.getElementById('noticePopover'),
        noticeCloseBtn: document.getElementById('noticeCloseBtn'),

        loginSheet: document.getElementById('loginSheet'),
        loginDesc: document.getElementById('loginDesc'),

        loginStepAuth: document.getElementById('loginStepAuth'),
        loginStepNickname: document.getElementById('loginStepNickname'),

        loginIdInput: document.getElementById('loginIdInput'),
        loginIdBtn: document.getElementById('loginIdBtn'),
        loginIdHelp: document.getElementById('loginIdHelp'),

        nicknameInput: document.getElementById('nicknameInput'),
        checkNicknameBtn: document.getElementById('checkNicknameBtn'),
        loginHelp: document.getElementById('loginHelp'),

        completeLoginBtn: document.getElementById('completeLoginBtn'),
        backToAuthBtn: document.getElementById('backToAuthBtn')
    };

    var protectedViews = {
        broker: true,
        site: true,
        tools: true,
        more: true
    };

    function formatGold(amount) {
        return Number(amount || 0).toLocaleString('ko-KR');
    }

    function updateGold() {
        if (!els.goldAmount) return;
        els.goldAmount.textContent = formatGold(state.gold);
    }

    function getSavedUser() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    }

    function saveUser(user) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch (error) {
            // 임시 로그인 저장 실패 시에도 현재 화면 상태는 유지한다.
        }
    }

    function removeSavedUser() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            // 삭제 실패 시에도 화면은 로그아웃 처리한다.
        }
    }
    function getSavedUsers() {
        try {
            var saved = localStorage.getItem(USERS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    function saveJoinedUser(user) {
        var users = getSavedUsers();
        var userId = normalizeNickname(user.nickname);

        var exists = users.some(function (savedUser) {
            return normalizeNickname(savedUser.nickname).toLowerCase() === userId.toLowerCase();
        });

        if (!exists) {
            users.push(user);
        }

        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } catch (error) {
            // 임시 회원 목록 저장 실패 시에도 현재 로그인은 유지한다.
        }
    }

    function findJoinedUserById(userId) {
        var target = normalizeNickname(userId).toLowerCase();
        var users = getSavedUsers();

        return users.find(function (user) {
            return normalizeNickname(user.nickname).toLowerCase() === target;
        }) || null;
    }

    function setLoginIdHelp(message, isError) {
        if (!els.loginIdHelp) return;

        els.loginIdHelp.textContent = message || '현재 베타에서는 가입 시 입력한 별명으로 로그인합니다.';
        els.loginIdHelp.classList.toggle('is-error', !!isError);
    }

    function loginWithId() {
        var userId = normalizeNickname(els.loginIdInput ? els.loginIdInput.value : '');
        var errorMessage = validateNickname(userId);

        if (errorMessage) {
            setLoginIdHelp(errorMessage, true);
            if (els.loginIdInput) els.loginIdInput.focus();
            return false;
        }

        var joinedUser = findJoinedUserById(userId);

        if (!joinedUser) {
            setLoginIdHelp('가입된 아이디를 찾지 못했어. 처음이라면 아래에서 가입해줘.', true);
            if (els.loginIdInput) els.loginIdInput.focus();
            return false;
        }

        state.user = {
            nickname: joinedUser.nickname,
            provider: joinedUser.provider || 'id',
            loggedInAt: new Date().toISOString()
        };

        saveUser(state.user);
        updateLoginButton();
        updateNoticeCount();
        closeLoginSheet();

        return true;
    }

    function isLoggedIn() {
        return !!(state.user && state.user.nickname);
    }

    function updateLoginButton() {
        if (els.loginBtnLabel) {
            els.loginBtnLabel.textContent = isLoggedIn() ? state.user.nickname : '로그인';
        }

        if (els.loginBtn) {
            els.loginBtn.classList.toggle('is-logged-in', isLoggedIn());
        }

        if (els.userAvatar) {
            els.userAvatar.classList.toggle('is-hidden', !isLoggedIn());
        }

        if (els.logoutBtn) {
            els.logoutBtn.classList.toggle('is-hidden', !isLoggedIn());
        }

        if (els.goldPill) {
            els.goldPill.classList.toggle('is-hidden', !isLoggedIn());
        }
    }


    function logout() {
        state.user = null;
        state.pendingProvider = '';

        removeSavedUser();
        updateLoginButton();
        updateNoticeCount();
        closeLoginSheet();

        if (protectedViews[state.currentView]) {
            setActiveView('home');
        }
    }

    function setLoginHelp(message, isError) {
        if (!els.loginHelp) return;

        els.loginHelp.textContent = message || '한글, 영문, 숫자 기준 2~8자로 입력해 주세요.';
        els.loginHelp.classList.toggle('is-error', !!isError);
    }

    function showAuthStep() {
        state.pendingProvider = '';

        if (els.loginStepAuth) {
            els.loginStepAuth.classList.add('is-active');
        }

        if (els.loginStepNickname) {
            els.loginStepNickname.classList.remove('is-active');
        }

        if (els.loginDesc) {
            els.loginDesc.textContent = '';
        }

        if (els.nicknameInput) {
            els.nicknameInput.value = '';
        }

        if (els.loginIdInput) {
            els.loginIdInput.value = '';
        }

        setLoginHelp('');
        setLoginIdHelp('');
    }

    function showNicknameStep(provider) {
        state.pendingProvider = provider || 'temp';

        if (els.loginStepAuth) {
            els.loginStepAuth.classList.remove('is-active');
        }

        if (els.loginStepNickname) {
            els.loginStepNickname.classList.add('is-active');
        }

        if (els.loginDesc) {
            els.loginDesc.textContent = '';
        }

        if (els.nicknameInput) {
            els.nicknameInput.value = isLoggedIn() ? state.user.nickname : '';

            window.setTimeout(function () {
                els.nicknameInput.focus();
            }, 80);
        }

        setLoginHelp('');
    }

    function openLoginSheet() {
        if (!els.loginSheet) return;

        closeNoticePopover();

        els.loginSheet.classList.add('is-open');
        els.loginSheet.setAttribute('aria-hidden', 'false');

        showAuthStep();
    }

    function closeLoginSheet() {
        if (!els.loginSheet) return;

        els.loginSheet.classList.remove('is-open');
        els.loginSheet.setAttribute('aria-hidden', 'true');

        showAuthStep();
    }
    function getNoticeReadKey() {
        if (isLoggedIn()) {
            return NOTICE_READ_KEY + '_' + normalizeNickname(state.user.nickname).toLowerCase();
        }

        return NOTICE_READ_KEY + '_guest';
    }

    function getReadNoticeIds() {
        try {
            var saved = localStorage.getItem(getNoticeReadKey());
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    function saveReadNoticeIds(ids) {
        try {
            localStorage.setItem(getNoticeReadKey(), JSON.stringify(ids));
        } catch (error) {
            // 읽음 저장 실패 시에도 화면은 계속 동작한다.
        }
    }

    function getUnreadNoticeIds() {
        var readIds = getReadNoticeIds();

        return notices
            .map(function (notice) {
                return notice.id;
            })
            .filter(function (noticeId) {
                return readIds.indexOf(noticeId) === -1;
            });
    }

    function updateNoticeCount() {
        if (!els.noticeCount) return;

        var unreadIds = getUnreadNoticeIds();
        var count = unreadIds.length;

        if (count > 0) {
            els.noticeCount.textContent = String(count);
            els.noticeCount.classList.remove('is-hidden');
        } else {
            els.noticeCount.textContent = '';
            els.noticeCount.classList.add('is-hidden');
        }
    }

    function markAllNoticesAsRead() {
        var readIds = getReadNoticeIds();

        notices.forEach(function (notice) {
            if (readIds.indexOf(notice.id) === -1) {
                readIds.push(notice.id);
            }
        });

        saveReadNoticeIds(readIds);
        updateNoticeCount();
    }

    function openNoticePopover() {
        if (!els.noticePopover) return;

        els.noticePopover.classList.add('is-open');
        els.noticePopover.setAttribute('aria-hidden', 'false');

        markAllNoticesAsRead();
    }

    function closeNoticePopover() {
        if (!els.noticePopover) return;

        els.noticePopover.classList.remove('is-open');
        els.noticePopover.setAttribute('aria-hidden', 'true');
    }

    function toggleNoticePopover() {
        if (!els.noticePopover) return;

        if (els.noticePopover.classList.contains('is-open')) {
            closeNoticePopover();
        } else {
            openNoticePopover();
        }
    }

    function normalizeNickname(value) {
        return String(value || '').trim().replace(/\s+/g, '');
    }

    function validateNickname(nickname) {
        if (nickname.length < 2 || nickname.length > 8) {
            return '별명은 2~8자로 입력해줘.';
        }

        if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
            return '별명은 한글, 영문, 숫자만 사용할 수 있어.';
        }

        return '';
    }
    function resetNicknameCheck() {
        state.nicknameChecked = false;
        state.checkedNickname = '';
    }

    function isMockNicknameTaken(nickname) {
        var takenNicknames = [
            '관리자',
            'admin',
            'zimo',
            '지모',
            'test',
            '테스트'
        ];

        return takenNicknames.indexOf(nickname.toLowerCase()) !== -1;
    }

    function checkNicknameAvailability() {
        var nickname = normalizeNickname(els.nicknameInput ? els.nicknameInput.value : '');
        var errorMessage = validateNickname(nickname);

        if (errorMessage) {
            resetNicknameCheck();
            setLoginHelp(errorMessage, true);
            if (els.nicknameInput) els.nicknameInput.focus();
            return false;
        }

        if (isMockNicknameTaken(nickname)) {
            resetNicknameCheck();
            setLoginHelp('이미 사용 중인 별명이야. 다른 별명을 입력해줘.', true);
            if (els.nicknameInput) els.nicknameInput.focus();
            return false;
        }

        state.nicknameChecked = true;
        state.checkedNickname = nickname;

        setLoginHelp('사용 가능한 별명입니다.', false);
        return true;
    }

    function completeTempLogin() {
        var nickname = normalizeNickname(els.nicknameInput ? els.nicknameInput.value : '');
        var errorMessage = validateNickname(nickname);

        if (errorMessage) {
            setLoginHelp(errorMessage, true);
            if (els.nicknameInput) els.nicknameInput.focus();
            return false;
        }

        if (!state.nicknameChecked || state.checkedNickname !== nickname) {
            setLoginHelp('먼저 별명 사용 가능 확인을 해줘.', true);
            return false;
        }

        state.user = {
            nickname: nickname,
            provider: state.pendingProvider || 'temp',
            loggedInAt: new Date().toISOString()
        };

        saveJoinedUser(state.user);
        saveUser(state.user);
        updateLoginButton();
        updateNoticeCount();
        closeLoginSheet();


        return true;
    }
    function getFeedbackItems() {
        try {
            var saved = localStorage.getItem(FEEDBACK_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    function saveFeedbackItems(items) {
        try {
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
        } catch (error) {
            // 저장 실패 시 화면 동작은 유지한다.
        }
    }

    function getFeedbackLikeKey() {
        if (isLoggedIn()) {
            return FEEDBACK_LIKES_KEY + '_' + normalizeNickname(state.user.nickname).toLowerCase();
        }

        return FEEDBACK_LIKES_KEY + '_guest';
    }

    function getLikedFeedbackIds() {
        try {
            var saved = localStorage.getItem(getFeedbackLikeKey());
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    function saveLikedFeedbackIds(ids) {
        try {
            localStorage.setItem(getFeedbackLikeKey(), JSON.stringify(ids));
        } catch (error) {
            // 저장 실패 시에도 화면은 유지한다.
        }
    }

    function getFeedbackCategoryLabel(category) {
        var labels = {
            feature: '기능 요청',
            pain: '불편사항',
            bug: '오류 제보',
            etc: '기타 의견'
        };

        return labels[category] || '기타 의견';
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatFeedbackDate(value) {
        var date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('.');
    }

    function seedFeedbackItems() {
        var items = getFeedbackItems();

        if (items.length > 0) return;

        var now = new Date().toISOString();

        saveFeedbackItems([
            {
                id: 'sample-feature-image-brightness',
                category: 'feature',
                title: '이미지 보정에서 밝기 조절도 있으면 좋겠어요',
                body: '사진이 어둡게 찍힌 경우가 많아서, 업로드 후 밝기와 선명도를 간단히 조절할 수 있으면 좋겠습니다.',
                author: '베타유저',
                likes: 7,
                createdAt: now
            },
            {
                id: 'sample-pain-simple-upload',
                category: 'pain',
                title: '사진 올리는 과정이 더 단순했으면 좋겠어요',
                body: '중개 매물 사진을 올릴 때 한 번에 여러 장을 올리고 순서만 쉽게 바꿀 수 있으면 편할 것 같습니다.',
                author: '현장실장',
                likes: 4,
                createdAt: now
            }
        ]);
    }

    function syncFeedbackCategoryUI() {
        var categoryInput = document.getElementById('feedbackCategory');
        var selectedLabel = document.getElementById('feedbackSelectedLabel');
        var label = getFeedbackCategoryLabel(state.feedbackCategory);

        document.querySelectorAll('[data-feedback-category]').forEach(function (button) {
            button.classList.toggle(
                'is-active',
                button.getAttribute('data-feedback-category') === state.feedbackCategory
            );
        });

        if (categoryInput) {
            categoryInput.value = state.feedbackCategory;
        }

        if (selectedLabel) {
            selectedLabel.textContent = label;
        }
    }

    function openFeedbackWritePanel() {
        if (!requireLogin()) return;

        var panel = document.getElementById('feedbackForm');
        var titleInput = document.getElementById('feedbackTitle');

        syncFeedbackCategoryUI();

        if (panel) {
            panel.classList.remove('is-hidden');
        }

        if (titleInput) {
            window.setTimeout(function () {
                titleInput.focus();
            }, 80);
        }
    }

    function closeFeedbackWritePanel() {
        var panel = document.getElementById('feedbackForm');

        if (panel) {
            panel.classList.add('is-hidden');
        }
    }

    function renderFeedbackList() {
        var list = document.getElementById('feedbackList');

        if (!list) return;

        var items = getFeedbackItems();
        var likedIds = getLikedFeedbackIds();

        if (state.feedbackSort === 'likes') {
            items.sort(function (a, b) {
                return Number(b.likes || 0) - Number(a.likes || 0);
            });
        } else {
            items.sort(function (a, b) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }

        if (items.length === 0) {
            list.innerHTML =
                '<div class="feedback-empty">' +
                '<strong>아직 등록된 의견이 없습니다.</strong>' +
                '<p>필요한 기능이나 불편한 점을 가장 먼저 남겨주세요.</p>' +
                '</div>';
            return;
        }
        var totalCount = items.length;
        var visibleItems = items.slice(0, state.feedbackVisibleCount);
        var hasMore = totalCount > visibleItems.length;

        list.innerHTML = visibleItems.map(function (item) {
            var isLiked = likedIds.indexOf(item.id) !== -1;

            return '' +
                '<article class="feedback-item" data-feedback-id="' + escapeHtml(item.id) + '">' +
                '<div class="feedback-item-top">' +
                '<span class="feedback-category">' + escapeHtml(getFeedbackCategoryLabel(item.category)) + '</span>' +
                '<span class="feedback-date">' + escapeHtml(formatFeedbackDate(item.createdAt)) + '</span>' +
                '</div>' +

                '<button type="button" class="feedback-open-btn" data-feedback-open="' + escapeHtml(item.id) + '">' +
                '<span>' + escapeHtml(item.title) + '</span>' +
                '<em>내용보기</em>' +
                '</button>' +

                '<div class="feedback-detail">' +
                '<p>' + escapeHtml(item.body) + '</p>' +
                '<small>이 의견은 운영자가 확인 후 서비스 개선에 참고합니다.</small>' +
                '</div>' +

                '<div class="feedback-item-bottom">' +
                '<span class="feedback-author">' + escapeHtml(item.author || '익명') + '</span>' +
                '<button type="button" class="feedback-like-btn' + (isLiked ? ' is-liked' : '') + '" data-feedback-like="' + escapeHtml(item.id) + '">' +
                '<span>좋아요</span>' +
                '<strong>' + Number(item.likes || 0) + '</strong>' +
                '</button>' +
                '</div>' +
                '</article>';
        }).join('') + (hasMore
            ? '<button type="button" class="feedback-more-btn" id="feedbackMoreBtn">더보기 ' + visibleItems.length + ' / ' + totalCount + '</button>'
            : '');
    }

    function createFeedbackItem() {
        if (!requireLogin()) return;

        var categoryInput = document.getElementById('feedbackCategory');
        var titleInput = document.getElementById('feedbackTitle');
        var bodyInput = document.getElementById('feedbackBody');

        var category = categoryInput ? categoryInput.value : state.feedbackCategory;
        var title = titleInput ? titleInput.value.trim() : '';
        var body = bodyInput ? bodyInput.value.trim() : '';

        if (title.length < 3) {
            showToolReadyMessage('feedbackTitle');
            return;
        }

        if (body.length < 5) {
            showToolReadyMessage('feedbackBody');
            return;
        }

        var items = getFeedbackItems();

        items.unshift({
            id: 'feedback-' + Date.now(),
            category: category,
            title: title,
            body: body,
            author: state.user && state.user.nickname ? state.user.nickname : '익명',
            likes: 0,
            createdAt: new Date().toISOString()
        });

        saveFeedbackItems(items);

        if (titleInput) titleInput.value = '';
        if (bodyInput) bodyInput.value = '';
        if (categoryInput) categoryInput.value = state.feedbackCategory;

        state.feedbackSort = 'latest';
        state.feedbackVisibleCount = 5;

        document.querySelectorAll('[data-feedback-sort]').forEach(function (button) {
            button.classList.toggle('is-active', button.getAttribute('data-feedback-sort') === 'latest');
        });
        closeFeedbackWritePanel();
        renderFeedbackList();
        showToolReadyMessage('feedbackSaved');
    }

    function toggleFeedbackLike(feedbackId) {
        if (!requireLogin()) return;

        var likedIds = getLikedFeedbackIds();

        if (likedIds.indexOf(feedbackId) !== -1) {
            showToolReadyMessage('feedbackAlreadyLiked');
            return;
        }

        var items = getFeedbackItems();

        items = items.map(function (item) {
            if (item.id === feedbackId) {
                item.likes = Number(item.likes || 0) + 1;
            }

            return item;
        });

        likedIds.push(feedbackId);

        saveFeedbackItems(items);
        saveLikedFeedbackIds(likedIds);

        renderFeedbackList();
    }

    function bindFeedbackBoard() {
        var form = document.getElementById('feedbackForm');

        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                createFeedbackItem();
            });
        }

        document.querySelectorAll('[data-feedback-category]').forEach(function (button) {
            button.addEventListener('click', function () {
                state.feedbackCategory = button.getAttribute('data-feedback-category') || 'feature';
                syncFeedbackCategoryUI();
            });
        });

        var writeOpenBtn = document.getElementById('feedbackWriteOpenBtn');

        if (writeOpenBtn) {
            writeOpenBtn.addEventListener('click', function () {
                openFeedbackWritePanel();
            });
        }

        var cancelBtn = document.getElementById('feedbackCancelBtn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                closeFeedbackWritePanel();
            });
        }

        document.querySelectorAll('[data-feedback-sort]').forEach(function (button) {
            button.addEventListener('click', function () {
                state.feedbackSort = button.getAttribute('data-feedback-sort') || 'latest';
                state.feedbackVisibleCount = 5;

                document.querySelectorAll('[data-feedback-sort]').forEach(function (sortButton) {
                    sortButton.classList.toggle('is-active', sortButton === button);
                });

                renderFeedbackList();
            });
        });

        var list = document.getElementById('feedbackList');

        if (list) {
            list.addEventListener('click', function (event) {
                var likeButton = event.target.closest('[data-feedback-like]');
                var moreButton = event.target.closest('#feedbackMoreBtn');

                if (moreButton) {
                    state.feedbackVisibleCount += 5;
                    renderFeedbackList();
                    return;
                }

                if (likeButton) {
                    toggleFeedbackLike(likeButton.getAttribute('data-feedback-like'));
                    return;
                }

                var openButton = event.target.closest('[data-feedback-open]');

                if (openButton) {
                    var item = openButton.closest('.feedback-item');

                    if (!item) return;

                    item.classList.toggle('is-open');

                    var label = openButton.querySelector('em');

                    if (label) {
                        label.textContent = item.classList.contains('is-open') ? '접기' : '내용보기';
                    }
                }
            });
        }
    }

    function requireLogin() {
        if (isLoggedIn()) return true;

        openLoginSheet();
        return false;
    }

    function setActiveView(viewName) {
        if (!views[viewName]) {
            viewName = 'home';
        }

        if (protectedViews[viewName] && !requireLogin()) {
            return false;
        }

        state.currentView = viewName;

        document.body.classList.toggle('is-tools-view', viewName === 'tools');

        if (viewName === 'tools') {
            renderToolHome();
        }

        Object.keys(views).forEach(function (key) {
            if (!views[key]) return;
            views[key].classList.toggle('is-active', key === viewName);
        });

        document.querySelectorAll('.hero-menu-item[data-view]').forEach(function (button) {
            var target = button.getAttribute('data-view');

            button.classList.remove('is-active');
            button.classList.toggle('is-current', target === viewName);
        });

        document.querySelectorAll('.nav-item[data-view]').forEach(function (button) {
            var target = button.getAttribute('data-view');
            button.classList.toggle('is-active', target === viewName);
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        return true;
    }


    function ensureNamecardCss() {
        if (document.getElementById('namecardToolCss')) {
            return;
        }

        var link = document.createElement('link');
        link.id = 'namecardToolCss';
        link.rel = 'stylesheet';
        link.href = './tools/namecard/namecard.css';

        document.head.appendChild(link);
    }

    function loadNamecardScript() {
        return new Promise(function (resolve, reject) {
            if (window.bootNamecardTool) {
                resolve();
                return;
            }

            var script = document.createElement('script');
            script.id = 'namecardToolScript';
            script.src = './tools/namecard/namecard.js';
            script.onload = function () {
                resolve();
            };
            script.onerror = function () {
                reject(new Error('namecard.js 로드 실패'));
            };

            document.body.appendChild(script);
        });
    }
    function ensureFlyerCss() {
        if (!document.getElementById('flyerToolCss')) {
            var flyerCss = document.createElement('link');
            flyerCss.id = 'flyerToolCss';
            flyerCss.rel = 'stylesheet';
            flyerCss.href = './tools/flyer/flyer.css';

            document.head.appendChild(flyerCss);
        }

        if (!document.getElementById('flyerA6ToolCss')) {
            var flyerA6Css = document.createElement('link');
            flyerA6Css.id = 'flyerA6ToolCss';
            flyerA6Css.rel = 'stylesheet';
            flyerA6Css.href = './tools/flyer/flyer-a6.css';

            document.head.appendChild(flyerA6Css);
        }
    }

    function loadFlyerScript() {
        return new Promise(function (resolve, reject) {
            if (window.bootFlyerTool) {
                resolve();
                return;
            }

            var script = document.createElement('script');
            script.id = 'flyerToolScript';
            script.src = './tools/flyer/flyer.js';
            script.onload = function () {
                resolve();
            };
            script.onerror = function () {
                reject(new Error('flyer.js 로드 실패'));
            };

            document.body.appendChild(script);
        });
    }
    function loadFlyerA6Script() {
        return new Promise(function (resolve, reject) {
            if (window.bootFlyerA6Tool) {
                resolve();
                return;
            }

            var existingScript = document.getElementById('flyerA6ToolScript');

            if (existingScript) {
                existingScript.addEventListener('load', function () {
                    resolve();
                });
                existingScript.addEventListener('error', function () {
                    reject(new Error('flyer-a6.js 로드 실패'));
                });
                return;
            }

            var script = document.createElement('script');
            script.id = 'flyerA6ToolScript';
            script.src = './tools/flyer/flyer-a6.js';
            script.onload = function () {
                resolve();
            };
            script.onerror = function () {
                reject(new Error('flyer-a6.js 로드 실패'));
            };

            document.body.appendChild(script);
        });
    }
    function setToolFocusMode(isActive) {
        var viewTools = document.getElementById('viewTools');

        if (!viewTools) return;

        viewTools.classList.toggle('is-tool-focus-mode', !!isActive);
    }

    function renderNamecardTool() {
        if (!els.toolPanel) return;

        els.toolPanel.classList.add('has-namecard-tool');
        els.toolPanel.innerHTML =
            '<div class="tool-empty">' +
            '<h3>디지털 명함 생성기 불러오는 중</h3>' +
            '<p>명함 제작 화면을 준비하고 있어.</p>' +
            '</div>';

        ensureNamecardCss();

        fetch('./tools/namecard/namecard.html')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('namecard.html 로드 실패');
                }

                return response.text();
            })
            .then(function (html) {
                els.toolPanel.innerHTML = html;

                return loadNamecardScript();
            })
            .then(function () {
                if (window.bootNamecardTool) {
                    window.bootNamecardTool();
                }

                window.setTimeout(function () {
                    els.toolPanel.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 120);
            })
            .catch(function () {
                els.toolPanel.classList.remove('has-namecard-tool');
                els.toolPanel.classList.remove('has-flyer-tool');
                els.toolPanel.innerHTML =
                    '<div class="tool-empty">' +
                    '<h3>명함 생성기를 불러오지 못했어</h3>' +
                    '<p>tools/namecard/namecard.html, namecard.css, namecard.js 경로를 확인해줘.</p>' +
                    '<button type="button" class="primary-btn" disabled>로드 실패</button>' +
                    '</div>';
            });
    }
    function renderFlyerTool() {

        if (!els.toolPanel) return;

        els.toolPanel.classList.remove('has-namecard-tool');
        els.toolPanel.classList.remove('has-flyer-tool');
        els.toolPanel.classList.add('has-flyer-tool');

        els.toolPanel.innerHTML =
            '<div class="tool-empty">' +
            '<h3>웹전단 제작기 불러오는 중</h3>' +
            '<p>웹전단 제작 화면을 준비하고 있어.</p>' +
            '</div>';

        ensureFlyerCss();

        fetch('./tools/flyer/flyer.html')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('flyer.html 로드 실패');
                }

                return response.text();
            })
            .then(function (html) {
                els.toolPanel.innerHTML = html;

                return loadFlyerScript()
                    .then(function () {
                        return loadFlyerA6Script();
                    });
            })
            .then(function () {
                if (window.bootFlyerTool) {
                    window.bootFlyerTool();
                }

                if (window.bootFlyerA6Tool) {
                    window.bootFlyerA6Tool();
                }

                window.setTimeout(function () {
                    els.toolPanel.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 120);
            })
            .catch(function () {
                els.toolPanel.classList.remove('has-flyer-tool');
                els.toolPanel.innerHTML =
                    '<div class="tool-empty">' +
                    '<h3>웹전단 제작기를 불러오지 못했어</h3>' +
                    '<p>tools/flyer/flyer.html, flyer.css, flyer.js 경로를 확인해줘.</p>' +
                    '<button type="button" class="primary-btn" disabled>로드 실패</button>' +
                    '</div>';
            });
    }
    function renderToolHome() {
        setToolFocusMode(false);

        document.querySelectorAll('#viewTools .tool-card[data-tool]').forEach(function (toolButton) {
            toolButton.classList.remove('is-ready');
        });

        if (!els.toolPanel) return;

        els.toolPanel.classList.remove('has-namecard-tool');
        els.toolPanel.classList.remove('has-flyer-tool');
        els.toolPanel.innerHTML =
            '<div class="tool-empty">' +
            '<h3>제작도구를 선택해줘</h3>' +
            '<p>필요한 제작 기능을 선택하면 해당 생성기만 열립니다.</p>' +
            '</div>';
    }

    function renderToolMessage(toolName) {
        if (!els.toolPanel) return;

        if (toolName === 'namecard') {
            renderNamecardTool();
            return;
        }
        if (toolName === 'flyer') {
            renderFlyerTool();
            return;
        }

        var toolMap = {
            image: {
                title: '이미지 보정',
                desc: '사진 업로드, 밝기 보정, 선명도 개선, 홍보 문구 정리 기능이 들어갈 자리야.',
                button: '준비중'
            },
            flyer: {
                title: '웹전단 제작',
                desc: '현장명, 조건, 혜택을 입력하면 공유용 웹전단을 만드는 영역이야.',
                button: '준비중'
            },
            video: {
                title: '홍보 영상 제작',
                desc: '사진 3~5장으로 짧은 홍보 영상을 만드는 기능이 들어갈 자리야.',
                button: '준비중'
            }
        };

        var tool = toolMap[toolName] || toolMap.image;

        els.toolPanel.classList.remove('has-namecard-tool');
        els.toolPanel.classList.remove('has-flyer-tool');

        els.toolPanel.innerHTML =
            '<div class="tool-empty">' +
            '<h3>' + tool.title + '</h3>' +
            '<p>' + tool.desc + '</p>' +
            '<button type="button" class="primary-btn" disabled>' + tool.button + '</button>' +
            '</div>';
    }
    function bindViewButtons() {
        document.querySelectorAll('[data-view]').forEach(function (button) {
            button.addEventListener('click', function () {
                var viewName = button.getAttribute('data-view');
                var isHeroMenuButton = button.classList.contains('hero-menu-item');
                var isFindHomeButton = viewName === 'home' && isHeroMenuButton;
                var findCard = document.querySelector('.find-home-card');

                var didMove = setActiveView(viewName);

                if (!didMove) {
                    return;
                }

                if (findCard) {
                    findCard.classList.add('is-hidden');
                }

                if (isFindHomeButton && findCard) {
                    findCard.classList.remove('is-hidden');

                    window.setTimeout(function () {
                        findCard.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }, 220);
                }
            });
        });
    }
    function bindFindHomeMenuButton() {
        var findHomeMenuBtn = document.getElementById('findHomeMenuBtn');
        var findCard = document.querySelector('.find-home-card');

        if (!findHomeMenuBtn) return;

        findHomeMenuBtn.addEventListener('click', function () {
            setActiveView('home');

            document.querySelectorAll('.hero-menu-item').forEach(function (button) {
                button.classList.remove('is-active');
                button.classList.remove('is-current');
            });

            findHomeMenuBtn.classList.add('is-current');

            if (findCard) {
                findCard.classList.remove('is-hidden');

                window.setTimeout(function () {
                    findCard.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 220);
            }
        });
    }

    function bindToolButtons() {
        document.querySelectorAll('#viewTools .tool-card[data-tool]').forEach(function (button) {
            button.addEventListener('click', function () {
                if (!requireLogin()) return;

                var toolName = button.getAttribute('data-tool');
                setToolFocusMode(true);

                document.querySelectorAll('#viewTools .tool-card[data-tool]').forEach(function (toolButton) {
                    toolButton.classList.toggle('is-ready', toolButton === button);
                });

                renderToolMessage(toolName);

                if (toolName !== 'namecard' && toolName !== 'flyer') {
                    showToolReadyMessage(toolName);
                }
            });
        });
    }

    function showToolReadyMessage(toolName) {
        var messageMap = {
            namecard: '디지털 명함 생성기는 다음 단계에서 연결할 거야.',
            image: '이미지 보정 기능은 준비중이야.',
            flyer: '웹전단 제작 기능은 준비중이야.',
            video: '홍보 영상 제작 기능은 준비중이야.',
            feedbackTitle: '제목을 3자 이상 입력해줘.',
            feedbackBody: '내용을 5자 이상 입력해줘.',
            feedbackSaved: '의견이 등록됐어.',
            feedbackAlreadyLiked: '이미 좋아요를 누른 의견이야.'
        };

        var message = messageMap[toolName] || '제작도구를 준비중이야.';
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
    function bindLoginButtons() {
        if (els.checkNicknameBtn) {
            els.checkNicknameBtn.addEventListener('click', checkNicknameAvailability);
        }

        if (els.loginIdBtn) {
            els.loginIdBtn.addEventListener('click', loginWithId);
        }

        if (els.loginIdInput) {
            els.loginIdInput.addEventListener('input', function () {
                setLoginIdHelp('');
            });

            els.loginIdInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    loginWithId();
                }
            });
        }

        if (els.loginBtn) {
            els.loginBtn.addEventListener('click', function () {
                if (isLoggedIn()) {
                    return;
                }

                openLoginSheet();
            });
        }

        if (els.logoutBtn) {
            els.logoutBtn.addEventListener('click', function () {
                logout();
            });
        }

        var betaBundleBtn = document.getElementById('betaBundleBtn');

        if (betaBundleBtn) {
            betaBundleBtn.addEventListener('click', function () {
                alert('베타 번들은 추후 오픈 예정입니다.');
            });
        }

        if (els.noticeBtn) {
            els.noticeBtn.addEventListener('click', function (event) {
                event.stopPropagation();
                toggleNoticePopover();
            });
        }

        if (els.noticeCloseBtn) {
            els.noticeCloseBtn.addEventListener('click', function (event) {
                event.stopPropagation();
                closeNoticePopover();
            });
        }

        if (els.noticePopover) {
            els.noticePopover.addEventListener('click', function (event) {
                event.stopPropagation();
            });
        }

        document.querySelectorAll('[data-auth-provider]').forEach(function (button) {
            button.addEventListener('click', function () {
                var provider = button.getAttribute('data-auth-provider');

                // 실제 연동 전이므로 지금은 인증 완료처럼 다음 단계로 넘긴다.
                showNicknameStep(provider);
            });
        });

        if (els.completeLoginBtn) {
            els.completeLoginBtn.addEventListener('click', completeTempLogin);
        }

        if (els.backToAuthBtn) {
            els.backToAuthBtn.addEventListener('click', showAuthStep);
        }

        if (els.nicknameInput) {
            els.nicknameInput.addEventListener('input', function () {
                var nickname = normalizeNickname(els.nicknameInput.value);

                if (nickname.length > 8) {
                    els.nicknameInput.value = nickname.slice(0, 8);
                }

                resetNicknameCheck();
                setLoginHelp('');
            });

            els.nicknameInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    completeTempLogin();
                }
            });
        }

        document.querySelectorAll('[data-login-close]').forEach(function (button) {
            button.addEventListener('click', closeLoginSheet);
        });

        document.addEventListener('click', function () {
            closeNoticePopover();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeLoginSheet();
                closeNoticePopover();
            }
        });
    }

    function boot() {
        state.user = getSavedUser();

        updateGold();
        updateLoginButton();
        updateNoticeCount();

        bindViewButtons();
        bindFindHomeMenuButton();
        bindToolButtons();
        bindFeedbackBoard();
        bindLoginButtons();

        seedFeedbackItems();
        syncFeedbackCategoryUI();
        renderFeedbackList();

        renderToolHome();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();