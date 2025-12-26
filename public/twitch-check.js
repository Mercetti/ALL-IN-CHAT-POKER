// twitch-check.js
// Usage: call ensureTwitchLinked({ required: true }) after login or on app init
// Relies on a Supabase client (prefers window.supabaseClient from supabase-auth.js)

async function ensureTwitchLinked({ required = true, supabaseClient } = {}) {
  const client =
    supabaseClient ||
    (typeof window !== 'undefined' && (window.supabaseClient || window.supabase));

  if (!client) {
    console.error('Supabase client not provided');
    return { ok: false, reason: 'no_client' };
  }

  // 1) Ensure user/session exists
  try {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const session = sessionData?.session;
    if (!session) {
      return { ok: false, reason: 'not_signed_in' };
    }
  } catch (err) {
    console.error('Failed to get session', err);
    return { ok: false, reason: 'session_error', error: err };
  }

  // 2) Fetch linked identities
  try {
    const { data: identitiesRes, error: identitiesError } = await client.auth.getUserIdentities();
    if (identitiesError) throw identitiesError;

    const identities = identitiesRes?.identities || [];
    const hasTwitch = identities.some((id) => id.provider === 'twitch');

    if (hasTwitch) {
      return { ok: true, linked: true };
    }

    // 3) Twitch missing
    if (!required) {
      return { ok: true, linked: false };
    }

    const shouldLink = confirm('Twitch is required for game features. Connect Twitch now?');
    if (!shouldLink) return { ok: false, reason: 'user_declined' };

    // 4) Start manual linking flow
    if (typeof client.auth.linkIdentity === 'function') {
      const { data, error } = await client.auth.linkIdentity({ provider: 'twitch' });
      if (error) {
        console.error('linkIdentity error', error);
        return { ok: false, reason: 'link_error', error };
      }
      return { ok: true, linkingStarted: true, data };
    } else if (typeof client.auth.signInWithOAuth === 'function') {
      await client.auth.signInWithOAuth({
        provider: 'twitch',
        options: { redirectTo: window.location.origin + '/callback.html' },
      });
      return { ok: true, linkingStarted: true, fallback: true };
    } else {
      return { ok: false, reason: 'no_link_api' };
    }
  } catch (err) {
    console.error('Error checking identities', err);
    return { ok: false, reason: 'identities_error', error: err };
  }
}

// Example auto-run (optional):
// (async () => {
//   const res = await ensureTwitchLinked({ required: true });
//   if (!res.ok) {
//     if (res.reason === 'not_signed_in') {
//       console.log('User not signed in');
//     } else if (res.reason === 'user_declined') {
//       alert('Twitch is required to play. You can link it later from your account page.');
//     } else {
//       console.warn('Twitch link check returned', res);
//     }
//   } else if (res.linked) {
//     console.log('Twitch already linked — good to go');
//   } else if (res.linkingStarted) {
//     console.log('Linking flow started');
//   }
// })();
