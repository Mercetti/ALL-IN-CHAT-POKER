// Supabase OAuth helper for the static frontend
(function() {
  const SUPABASE_URL = 'https://ertwjobuopcnrmdojeps.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_b_GSUmpGQPhTBh_vow7O8g_S3IblsBa';

  if (!window.supabase) {
    console.warn('Supabase JS not loaded');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true },
  });

  const getRedirectUrl = () => `${window.location.origin}/callback.html`;

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
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const session = data?.session;
    const user = session?.user;
    if (!session || !user) throw new Error('No session found');

    // Upsert profile using the authed session (RLS should allow auth.uid())
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Unknown',
      provider: user.app_metadata?.provider || user.user_metadata?.provider || 'unknown',
    };
    const { error: upsertError } = await client.from('profiles').upsert(profile, { onConflict: 'id' });
    if (upsertError) throw upsertError;
    return { session, user };
  }

  window.supabaseClient = client;
  window.startSupabaseOAuth = startOAuth;
  window.handleSupabaseCallbackAndUpsert = handleCallbackAndUpsert;
})();
