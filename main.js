(function () {
    'use strict';

    var STORAGE_KEY = 'zimo_biz_temp_user';
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
        signupProvider: '',
        signupNicknameChecked: false,
        checkedSignupNickname: '',
        pendingKakaoUser: null,
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

        loginNicknameInput: document.getElementById('loginNicknameInput'),
        loginPasswordInput: document.getElementById('loginPasswordInput'),
        loginIdBtn: document.getElementById('loginIdBtn'),
        loginIdHelp: document.getElementById('loginIdHelp'),


        loginTitle: document.getElementById('loginTitle'),
        loginStepSignup: document.getElementById('loginStepSignup'),

        signupNicknameInput: document.getElementById('signupNicknameInput'),
        signupEmailInput: document.getElementById('signupEmailInput'),
        signupPhoneInput: document.getElementById('signupPhoneInput'),
        signupPasswordField: document.getElementById('signupPasswordField'),
        signupPasswordInput: document.getElementById('signupPasswordInput'),
        signupHelp: document.getElementById('signupHelp'),
        completeSignupBtn: document.getElementById('completeSignupBtn'),
        checkSignupNicknameBtn: document.getElementById('checkSignupNicknameBtn')


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


    function setLoginIdHelp(message, isError) {
        if (!els.loginIdHelp) return;

        els.loginIdHelp.textContent = message || '현재 베타에서는 가입 시 입력한 별명으로 로그인합니다.';
        els.loginIdHelp.classList.toggle('is-error', !!isError);
    }

    async function loginWithId() {
        var nickname = normalizeNickname(els.loginNicknameInput ? els.loginNicknameInput.value : '');
        var password = els.loginPasswordInput ? String(els.loginPasswordInput.value || '') : '';

        var nicknameError = validateNickname(nickname);

        if (nicknameError) {
            setLoginIdHelp(nicknameError, true);
            if (els.loginNicknameInput) els.loginNicknameInput.focus();
            return false;
        }

        if (password.length < 6) {
            setLoginIdHelp('비밀번호는 6자 이상 입력해 주세요.', true);
            if (els.loginPasswordInput) els.loginPasswordInput.focus();
            return false;
        }

        if (!window.ZIMO_SUPABASE_READY || !window.zimoSupabase) {
            setLoginIdHelp('Supabase 연결이 아직 준비되지 않았습니다.', true);
            return false;
        }

        setLoginIdHelp('로그인 정보를 확인하고 있습니다...', false);


        var emailLookup = await window.zimoSupabase
            .rpc('get_profile_email_by_nickname', {
                check_nickname: nickname
            });

        if (emailLookup.error || !emailLookup.data) {
            setLoginIdHelp('닉네임 또는 비밀번호가 올바르지 않습니다.', true);
            if (els.loginNicknameInput) els.loginNicknameInput.focus();
            return false;
        }

        var email = normalizeEmail(emailLookup.data);

        setLoginIdHelp('로그인 중입니다...', false);

        var loginResult = await window.zimoSupabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (loginResult.error) {
            setLoginIdHelp('닉네임 또는 비밀번호가 올바르지 않습니다.', true);
            return false;
        }

        var authUser = loginResult.data && loginResult.data.user;

        if (!authUser || !authUser.id) {
            setLoginIdHelp('로그인 정보는 확인했지만 사용자 ID를 찾지 못했습니다.', true);
            return false;
        }

        var profileResult = await window.zimoSupabase
            .from('profiles')
            .select('nickname, email, phone, provider, gold')
            .eq('id', authUser.id)
            .single();

        if (profileResult.error || !profileResult.data) {
            setLoginIdHelp('회원 프로필을 찾지 못했습니다. 다시 회원가입해 주세요.', true);
            return false;
        }

        state.user = {
            id: authUser.id,
            nickname: profileResult.data.nickname,
            email: profileResult.data.email,
            phone: profileResult.data.phone,
            provider: profileResult.data.provider || 'email',
            gold: Number(profileResult.data.gold || 10000),
            loggedInAt: new Date().toISOString()
        };

        state.gold = Number(state.user.gold || 10000);

        saveUser(state.user);
        updateGold();
        updateLoginButton();
        updateNoticeCount();
        closeLoginSheetAfterSignup();

        return true;
    }

    function loginWithKakao() {
        setLoginIdHelp('카카오 로그인은 준비중입니다. 현재는 이메일로 가입해 주세요.', false);
        showToolReadyMessage('kakaoReady');
        return false;
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


    async function logout() {
        if (window.ZIMO_SUPABASE_READY && window.zimoSupabase) {
            await window.zimoSupabase.auth.signOut();
        }

        state.user = null;

        removeSavedUser();
        updateGold();
        updateLoginButton();
        updateNoticeCount();
        closeLoginSheet();

        if (protectedViews[state.currentView]) {
            setActiveView('home');
        }
    }

    function setSignupHelp(message, isError) {
        if (!els.signupHelp) return;

        els.signupHelp.textContent = message || '회원가입 정보를 입력해 주세요.';
        els.signupHelp.classList.toggle('is-error', !!isError);
    }

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function normalizePhone(value) {
        return String(value || '').replace(/[^0-9]/g, '');
    }

    function validateEmail(email) {
        if (!email) {
            return '이메일을 입력해 주세요.';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return '이메일 형식이 올바르지 않아요.';
        }

        return '';
    }

    function validatePhone(phone) {
        if (!phone) {
            return '전화번호를 입력해 주세요.';
        }

        if (phone.length < 9 || phone.length > 11) {
            return '전화번호는 숫자만 9~11자리로 입력해 주세요.';
        }

        return '';
    }


    function showSignupStep(provider) {
        state.signupProvider = provider || 'email';

        if (els.loginStepAuth) {
            els.loginStepAuth.classList.remove('is-active');
        }


        if (els.loginStepSignup) {
            els.loginStepSignup.classList.add('is-active');
        }

        if (els.loginTitle) {
            els.loginTitle.textContent = state.signupProvider === 'kakao'
                ? '카카오 회원가입'
                : '이메일 회원가입';
        }

        if (els.loginDesc) {
            els.loginDesc.textContent = state.signupProvider === 'kakao'
                ? '카카오 인증이 완료되었습니다. 닉네임과 전화번호를 입력해 가입을 마무리해 주세요.'
                : '이메일, 닉네임, 전화번호 기준으로 중복 가입을 확인합니다.';

            els.loginDesc.classList.remove('is-hidden');
        }

        if (els.signupPasswordField) {
            els.signupPasswordField.classList.toggle('is-hidden', state.signupProvider === 'kakao');
        }

        if (els.signupNicknameInput) els.signupNicknameInput.value = '';

        if (els.signupEmailInput) {
            els.signupEmailInput.value = state.signupProvider === 'kakao' && state.pendingKakaoUser
                ? normalizeEmail(state.pendingKakaoUser.email)
                : '';

            els.signupEmailInput.readOnly = state.signupProvider === 'kakao';
            els.signupEmailInput.classList.toggle('is-readonly', state.signupProvider === 'kakao');
        }

        if (els.signupPhoneInput) els.signupPhoneInput.value = '';
        if (els.signupPasswordInput) els.signupPasswordInput.value = '';

        setSignupHelp(
            state.signupProvider === 'kakao'
                ? '닉네임 중복확인 후 전화번호를 입력해 주세요.'
                : '닉네임 중복확인 후 이메일, 전화번호, 비밀번호를 입력해 주세요.',
            false
        );

        if (els.signupNicknameInput) {
            window.setTimeout(function () {
                els.signupNicknameInput.focus();
            }, 80);
        }
    }

    async function completeSignup() {
        var provider = state.signupProvider || 'email';
        var nickname = normalizeNickname(els.signupNicknameInput ? els.signupNicknameInput.value : '');
        var email = normalizeEmail(els.signupEmailInput ? els.signupEmailInput.value : '');
        var phone = normalizePhone(els.signupPhoneInput ? els.signupPhoneInput.value : '');
        var password = els.signupPasswordInput ? String(els.signupPasswordInput.value || '') : '';

        var nicknameError = validateNickname(nickname);
        var emailError = validateEmail(email);
        var phoneError = validatePhone(phone);

        if (nicknameError) {
            setSignupHelp(nicknameError, true);
            if (els.signupNicknameInput) els.signupNicknameInput.focus();
            return false;
        }

        if (provider === 'email' && emailError) {
            setSignupHelp(emailError, true);
            if (els.signupEmailInput) els.signupEmailInput.focus();
            return false;
        }

        if (phoneError) {
            setSignupHelp(phoneError, true);
            if (els.signupPhoneInput) els.signupPhoneInput.focus();
            return false;
        }

        if (provider === 'email' && password.length < 6) {
            setSignupHelp('비밀번호는 6자 이상 입력해 주세요.', true);
            if (els.signupPasswordInput) els.signupPasswordInput.focus();
            return false;
        }

        if (!state.signupNicknameChecked || state.checkedSignupNickname !== nickname) {
            setSignupHelp('닉네임 중복확인을 먼저 해주세요.', true);
            if (els.signupNicknameInput) els.signupNicknameInput.focus();
            return false;
        }

        if (!window.ZIMO_SUPABASE_READY || !window.zimoSupabase) {
            setSignupHelp('Supabase 연결이 아직 준비되지 않았습니다.', true);
            return false;
        }

        var supabaseUserId = '';

        if (provider === 'email') {
            setSignupHelp('회원가입을 처리하고 있습니다...', false);

            var signupResult = await window.zimoSupabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        nickname: nickname,
                        phone: phone,
                        provider: provider
                    }
                }
            });

            if (signupResult.error) {
                setSignupHelp(signupResult.error.message || '회원가입 중 오류가 발생했습니다.', true);
                return false;
            }

            var authUser = signupResult.data && signupResult.data.user;

            if (!authUser || !authUser.id) {
                setSignupHelp('회원 정보 생성은 되었지만 사용자 ID를 확인하지 못했습니다.', true);
                return false;
            }

            supabaseUserId = authUser.id;

            setSignupHelp('인증 메일 발송 완료. 링크 확인 후 로그인해 주세요.', false);
            return true;
        }

        if (provider === 'kakao') {
            if (!state.pendingKakaoUser || !state.pendingKakaoUser.id) {
                setSignupHelp('카카오 인증 정보를 찾지 못했습니다. 다시 카카오로 시작해 주세요.', true);
                return false;
            }

            supabaseUserId = state.pendingKakaoUser.id;
            email = normalizeEmail(state.pendingKakaoUser.email || '');

            if (!email) {
                email = supabaseUserId + '@kakao.local';
            }

            setSignupHelp('카카오 회원정보를 저장하고 있습니다...', false);
        }

        var profileResult = await window.zimoSupabase
            .from('profiles')
            .insert({
                id: supabaseUserId,
                nickname: nickname,
                email: email,
                phone: phone,
                provider: provider,
                gold: 10000
            });

        if (profileResult.error) {
            var profileErrorMessage = profileResult.error.message || '';
            var profileErrorCode = profileResult.error.code || '';
            var profileErrorDetail = profileResult.error.details || '';
            var profileErrorText = [
                profileErrorMessage,
                profileErrorCode,
                profileErrorDetail
            ].join(' ');

            if (profileErrorText.indexOf('profiles_phone_key') !== -1) {
                setSignupHelp('이미 가입된 전화번호입니다. 기존 계정으로 로그인해 주세요.', true);
                if (els.signupPhoneInput) els.signupPhoneInput.focus();
                return false;
            }

            if (profileErrorText.indexOf('profiles_email_key') !== -1) {
                setSignupHelp('이미 가입된 이메일입니다. 기존 계정으로 로그인해 주세요.', true);
                if (els.signupEmailInput) els.signupEmailInput.focus();
                return false;
            }

            if (profileErrorText.indexOf('profiles_nickname_key') !== -1) {
                setSignupHelp('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.', true);
                if (els.signupNicknameInput) els.signupNicknameInput.focus();
                return false;
            }

            setSignupHelp('프로필 저장 중 오류가 발생했습니다: ' + profileErrorMessage, true);
            return false;
        }

        var now = new Date().toISOString();

        state.user = {
            id: supabaseUserId,
            nickname: nickname,
            email: email,
            phone: phone,
            provider: provider,
            gold: 10000,
            createdAt: now,
            loggedInAt: now
        };

        state.gold = 10000;
        state.pendingKakaoUser = null;

        saveUser(state.user);
        updateGold();
        updateLoginButton();
        updateNoticeCount();
        closeLoginSheetAfterSignup();

        return true;
    }

    function showAuthStep() {

        if (els.loginStepAuth) {
            els.loginStepAuth.classList.add('is-active');
        }

        if (els.loginStepSignup) {
            els.loginStepSignup.classList.remove('is-active');
        }

        state.signupProvider = '';

        if (els.loginTitle) {
            els.loginTitle.textContent = '간편 로그인';
        }

        if (els.loginDesc) {
            els.loginDesc.textContent = '';
            els.loginDesc.classList.add('is-hidden');
        }

        if (els.loginNicknameInput) {
            els.loginNicknameInput.value = '';
        }

        if (els.loginPasswordInput) {
            els.loginPasswordInput.value = '';
        }

        if (els.signupEmailInput) {
            els.signupEmailInput.readOnly = false;
            els.signupEmailInput.classList.remove('is-readonly');
        }

        setLoginIdHelp('');
    }


    function openLoginSheet() {
        if (!els.loginSheet) return;

        closeNoticePopover();

        els.loginSheet.classList.add('is-open');
        els.loginSheet.setAttribute('aria-hidden', 'false');

        showAuthStep();
    }

    async function cancelPendingKakaoSignup() {
        if (state.signupProvider !== 'kakao' || !state.pendingKakaoUser) {
            return false;
        }

        state.pendingKakaoUser = null;

        if (window.ZIMO_SUPABASE_READY && window.zimoSupabase) {
            await window.zimoSupabase.auth.signOut();
        }

        removeSavedUser();

        return true;
    }

    async function closeLoginSheet() {
        if (!els.loginSheet) return;

        await cancelPendingKakaoSignup();

        els.loginSheet.classList.remove('is-open');
        els.loginSheet.setAttribute('aria-hidden', 'true');

        showAuthStep();
    }

    function closeLoginSheetAfterSignup() {
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
            return '별명은 2~8자로 입력해 주세요.';
        }

        if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
            return '별명은 한글, 영문, 숫자만 사용할 수 있어요.';
        }

        return '';
    }

    function resetSignupNicknameCheck() {
        state.signupNicknameChecked = false;
        state.checkedSignupNickname = '';

        if (els.checkSignupNicknameBtn) {
            els.checkSignupNicknameBtn.textContent = '중복확인';
            els.checkSignupNicknameBtn.disabled = false;
        }
    }
    async function checkSignupNicknameAvailability() {
        var nickname = normalizeNickname(els.signupNicknameInput ? els.signupNicknameInput.value : '');
        var errorMessage = validateNickname(nickname);

        if (errorMessage) {
            resetSignupNicknameCheck();
            setSignupHelp(errorMessage, true);
            if (els.signupNicknameInput) els.signupNicknameInput.focus();
            return false;
        }

        if (!window.ZIMO_SUPABASE_READY || !window.zimoSupabase) {
            setSignupHelp('Supabase 연결이 아직 준비되지 않았습니다.', true);
            return false;
        }

        setSignupHelp('닉네임 중복을 확인하고 있습니다...', false);

        var result = await window.zimoSupabase.rpc('check_profile_duplicate', {
            check_nickname: nickname,
            check_email: null,
            check_phone: null
        });

        if (result.error) {
            setSignupHelp('닉네임 확인 중 오류가 발생했습니다: ' + result.error.message, true);
            return false;
        }

        var row = result.data && result.data[0];

        if (row && row.nickname_exists) {
            resetSignupNicknameCheck();
            setSignupHelp('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.', true);
            if (els.signupNicknameInput) els.signupNicknameInput.focus();
            return false;
        }

        state.signupNicknameChecked = true;
        state.checkedSignupNickname = nickname;

        setSignupHelp('사용 가능한 닉네임입니다.', false);

        if (els.checkSignupNicknameBtn) {
            els.checkSignupNicknameBtn.textContent = '확인완료';
            els.checkSignupNicknameBtn.disabled = true;
        }

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
        link.href = './tools/namecard/namecard.css?v=70';

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
            script.src = './tools/namecard/namecard.js?v=40';
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
        /*
            웹전단 진입 시 CSS 순서를 다시 정리한다.
     
            최종 순서:
            1. flyer.css
            2. flyer-a6.css
            3. flyer-apt-fix.css
        */

        var oldFlyerCss = document.getElementById('flyerToolCss');
        var oldA6Css = document.getElementById('flyerA6ToolCss');
        var oldAptFixCss = document.getElementById('flyerAptFixCss');

        if (oldFlyerCss) oldFlyerCss.remove();
        if (oldA6Css) oldA6Css.remove();
        if (oldAptFixCss) oldAptFixCss.remove();

        var flyerCss = document.createElement('link');
        flyerCss.id = 'flyerToolCss';
        flyerCss.rel = 'stylesheet';
        flyerCss.href = './tools/flyer/flyer.css?v=1';
        document.head.appendChild(flyerCss);

        var flyerA6Css = document.createElement('link');
        flyerA6Css.id = 'flyerA6ToolCss';
        flyerA6Css.rel = 'stylesheet';
        flyerA6Css.href = './tools/flyer/flyer-a6.css?v=1';
        document.head.appendChild(flyerA6Css);

        var flyerAptFixCss = document.createElement('link');
        flyerAptFixCss.id = 'flyerAptFixCss';
        flyerAptFixCss.rel = 'stylesheet';
        flyerAptFixCss.href = './tools/flyer/flyer-apt-fix.css?v=20';
        document.head.appendChild(flyerAptFixCss);
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
            '<p>명함 제작 화면을 준비하고 있습니다.</p>' +
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
                    '<h3>명함 생성기를 불러오지 못했습니다</h3>' +
                    '<p>tools/namecard/namecard.html, namecard.css, namecard.js 경로를 확인해 주세요.</p>' +
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
            '<p>웹전단 제작 화면을 준비하고 있습니다.</p>' +
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
                    '<h3>웹전단 제작기를 불러오지 못했습니다</h3>' +
                    '<p>tools/flyer/flyer.html, flyer.css, flyer.js 경로를 확인해 주세요.</p>' +
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
            '<h3>제작도구를 선택해 주세요</h3>' +
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
                desc: '이미지 보정 기능은 베타 이후 오픈 예정입니다.',
                button: '준비중입니다'
            },
            flyer: {
                title: '웹전단 제작',
                desc: '현장명, 조건, 혜택을 입력하면 공유용 웹전단을 만드는 영역입니다.',
                button: '준비중입니다'
            },
            video: {
                title: '홍보 영상 제작',
                desc: '홍보 영상 제작 기능은 베타 이후 오픈 예정입니다.',
                button: '준비중입니다'
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
            kakaoReady: '카카오 로그인은 준비중입니다. 현재는 이메일로 가입해 주세요.',
            namecard: '디지털 명함 생성기는 현재 이용 가능합니다.',
            image: '이미지 보정 기능은 베타 이후 오픈 예정입니다.',
            flyer: '웹전단 제작 기능은 현재 이용 가능합니다.',
            video: '홍보 영상 제작 기능은 베타 이후 오픈 예정입니다.',
            feedbackTitle: '제목을 3자 이상 입력해 주세요.',
            feedbackBody: '내용을 5자 이상 입력해 주세요.',
            feedbackSaved: '의견이 등록되었습니다.',
            feedbackAlreadyLiked: '이미 좋아요를 누른 의견입니다.'
        };

        var message = messageMap[toolName] || '제작도구를 준비중입니다.';
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

        if (els.checkSignupNicknameBtn) {
            els.checkSignupNicknameBtn.addEventListener('click', checkSignupNicknameAvailability);
        }

        if (els.loginIdBtn) {
            els.loginIdBtn.addEventListener('click', loginWithId);
        }

        [
            els.loginNicknameInput,
            els.loginPasswordInput
        ].forEach(function (input) {
            if (!input) return;

            input.addEventListener('input', function () {
                setLoginIdHelp('');
            });

            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    loginWithId();
                }
            });
        });

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

        document.querySelectorAll('[data-signup-provider]').forEach(function (button) {
            button.addEventListener('click', function () {
                var provider = button.getAttribute('data-signup-provider') || 'email';

                if (provider === 'kakao') {
                    loginWithKakao();
                    return;
                }

                showSignupStep(provider);
            });
        });

        if (els.completeSignupBtn) {
            els.completeSignupBtn.addEventListener('click', completeSignup);
        }



        [
            els.signupNicknameInput,
            els.signupEmailInput,
            els.signupPhoneInput,
            els.signupPasswordInput
        ].forEach(function (input) {
            if (!input) return;

            input.addEventListener('input', function () {
                if (input === els.signupNicknameInput) {
                    var nickname = normalizeNickname(input.value);

                    if (nickname.length > 8) {
                        input.value = nickname.slice(0, 8);
                    }

                    resetSignupNicknameCheck();
                }

                if (input === els.signupPhoneInput) {
                    input.value = normalizePhone(input.value);
                }

                setSignupHelp('');
            });

            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    completeSignup();
                }
            });
        });

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
    async function restoreSupabaseSession() {
        if (!window.ZIMO_SUPABASE_READY || !window.zimoSupabase) {
            return false;
        }

        var sessionResult = await window.zimoSupabase.auth.getSession();
        var session = sessionResult.data && sessionResult.data.session;
        var authUser = session && session.user;

        if (!authUser || !authUser.id) {
            return false;
        }

        var profileResult = await window.zimoSupabase
            .from('profiles')
            .select('nickname, email, phone, provider, gold')
            .eq('id', authUser.id)
            .maybeSingle();

        if (profileResult.error) {
            return false;
        }

        if (!profileResult.data) {
            state.pendingKakaoUser = {
                id: authUser.id,
                email: normalizeEmail(authUser.email || ''),
                provider: 'kakao'
            };

            openLoginSheet();
            showSignupStep('kakao');

            return false;
        }

        state.pendingKakaoUser = null;

        state.user = {
            id: authUser.id,
            nickname: profileResult.data.nickname,
            email: profileResult.data.email,
            phone: profileResult.data.phone,
            provider: profileResult.data.provider || 'email',
            gold: Number(profileResult.data.gold || 10000),
            loggedInAt: new Date().toISOString()
        };

        state.gold = Number(state.user.gold || 10000);

        saveUser(state.user);
        updateGold();
        updateLoginButton();
        updateNoticeCount();

        return true;
    }

    async function boot() {
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

        await restoreSupabaseSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();