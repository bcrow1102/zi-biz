(function () {
    'use strict';

    var STORAGE_KEY = 'zimo_biz_temp_user';
    var USERS_KEY = 'zimo_biz_temp_users';
    var NOTICE_READ_KEY = 'zimo_biz_notice_read_ids';

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
        checkedNickname: ''
    };

    var views = {
        home: document.getElementById('viewHome'),
        broker: document.getElementById('viewBroker'),
        site: document.getElementById('viewSite'),
        tools: document.getElementById('viewTools'),
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
            var saved = sessionStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    }
    function saveUser(user) {
        try {
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
            return;
        }



        state.currentView = viewName;

        Object.keys(views).forEach(function (key) {
            if (!views[key]) return;
            views[key].classList.toggle('is-active', key === viewName);
        });

        document.querySelectorAll('[data-view]').forEach(function (button) {
            var target = button.getAttribute('data-view');
            button.classList.toggle('is-active', target === viewName);
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    function renderToolMessage(toolName) {
        if (!els.toolPanel) return;

        var toolMap = {
            namecard: {
                title: '디지털 명함 생성기',
                desc: '오늘은 이식 준비 단계야. 다음 단계에서 명함 생성기 UI를 이 영역 안으로 넣자.',
                button: '명함 생성기 준비중'
            },
            image: {
                title: '이미지 보정',
                desc: '사진 업로드, 밝기 보정, 선명도 개선 기능이 들어갈 자리야.',
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

        var tool = toolMap[toolName] || toolMap.namecard;

        els.toolPanel.classList.remove('has-namecard-tool');

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
                setActiveView(viewName);
            });
        });
    }

    function bindToolButtons() {
        document.querySelectorAll('[data-tool]').forEach(function (button) {
            button.addEventListener('click', function () {
                if (!requireLogin()) return;

                var toolName = button.getAttribute('data-tool');

                document.querySelectorAll('[data-tool]').forEach(function (toolButton) {
                    toolButton.classList.toggle('is-ready', toolButton === button);
                });

                renderToolMessage(toolName);
            });
        });
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
        bindToolButtons();
        bindLoginButtons();

        renderToolMessage('namecard');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();