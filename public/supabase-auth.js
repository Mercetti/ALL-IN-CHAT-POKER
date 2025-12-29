// Supabase OAuth helper for the static frontend
(function() {
  if (!window.supabase) {
    console.warn('Supabase JS not loaded');
    return;
  }

  let client = null;
  let EDGE_FN_URL = '';

  async function loadConfig() {
    const res = await fetch('/public-config.json', { method: 'GET' });
    const cfg = await res.json().catch(() => ({}));
    const SUPABASE_URL = (cfg.supabaseUrl || '').trim();
    const SUPABASE_ANON_KEY = (cfg.supabaseAnonKey || '').trim();
    EDGE_FN_URL = (cfg.supabaseEdgeFnUrl || '').trim();
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !EDGE_FN_URL) {
      throw new Error('Supabase config not available');
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true },
    });
    window.supabaseClient = client;
  }

  const getRedirectUrl = () => `${window.location.origin}/callback.html`;

  async function startOAuth(provider) {
    try {
      if (!client) await loadConfig();
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
    if (!client) await loadConfig();
    // If the provider redirected back with an error, surface it early
    const params = new URLSearchParams(window.location.search || '');
    const redirectError = params.get('error');
    const redirectErrorDesc = params.get('error_description');
    if (redirectError) {
      throw new Error(
        redirectErrorDesc
          ? `Supabase redirect error: ${redirectErrorDesc}`
          : `Supabase redirect error: ${redirectError}`
      );
    }

    // If code is present (PKCE), exchange for session first
    try {
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

  window.startSupabaseOAuth = startOAuth;
  window.handleSupabaseCallbackAndUpsert = handleCallbackAndUpsert;
})();
