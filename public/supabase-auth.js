// Supabase OAuth helper for the static frontend
(function() {
  const SUPABASE_URL = 'https://ertwjobuopcnrmdojeps.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_b_GSUmpGQPhTBh_vow7O8g_S3IblsBa';
  const EDGE_FN_URL = 'https://ertwjobuopcnrmdojeps.supabase.co/functions/v1/validate-token-upsert';

  if (!window.supabase) {
    console.warn('Supabase JS not loaded');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true },
  });

  const getRedirectUrl = () => `${window.location.origin}/auth/callback`;

  async function startOAuth(provider) {
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl(),
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Supabase OAuth error', err);
      alert('Sign-in failed: ' + (err.message || err));
    }
  }

  async function handleCallbackAndUpsert() {
    // If code is present (PKCE), exchange for session first
    try {
      const params = new URLSearchParams(window.location.search || '');
      const code = params.get('code');
      if (code && typeof client.auth.exchangeCodeForSession === 'function') {
        const { error: exErr } = await client.auth.exchangeCodeForSession({
          code,
          redirectTo: getRedirectUrl(),
        });
        if (exErr) console.warn('Supabase code exchange failed', exErr);
      }
    } catch (ex) {
      console.warn('Code exchange attempt failed', ex);
    }

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const session = data?.session;
    const user = session?.user;
    if (!session || !user) throw new Error('No session found');

    // Call Edge Function to validate token and upsert profile server-side
    const resp = await fetch(EDGE_FN_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok || !body.ok) {
      try {
        localStorage.setItem('supabaseEdgeResult', JSON.stringify({ ok: false, body, at: Date.now() }));
      } catch {
        /* ignore */
      }
      throw new Error(body.error || 'Upsert failed');
    }
    try {
      localStorage.setItem('supabaseEdgeResult', JSON.stringify({ ok: true, body, at: Date.now() }));
    } catch {
      /* ignore */
    }
    return { session, user };
  }

  window.supabaseClient = client;
  window.startSupabaseOAuth = startOAuth;
  window.handleSupabaseCallbackAndUpsert = handleCallbackAndUpsert;
})();
