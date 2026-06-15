(function () {
  'use strict';

  /*
      Supabase 연결 파일

      1. Supabase 프로젝트를 만든 뒤
      2. Project URL
      3. anon public key
      를 아래에 넣는다.
  */

  var SUPABASE_URL = 'https://fduzcmtdhsjkjbhncxgj.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_AZT434KaqJyXQBI5o1EaEw_hOiEAfpL';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[zimo biz] Supabase URL 또는 anon key가 아직 입력되지 않았습니다.');

    window.ZIMO_SUPABASE_READY = false;
    window.zimoSupabase = null;

    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[zimo biz] Supabase 라이브러리가 로드되지 않았습니다.');

    window.ZIMO_SUPABASE_READY = false;
    window.zimoSupabase = null;

    return;
  }

  window.zimoSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: true
      }
    }
  );

  window.ZIMO_SUPABASE_READY = true;

  console.log('[zimo biz] Supabase 연결 준비 완료');
})();