// twitch-check.js
// Usage: call ensureTwitchLinked({ required: true }) after login or on app init.
// This version relies on our backend session cookies instead of Supabase.

async function ensureTwitchLinked({ required = true } = {}) {
  try {
    const res = await fetch('/auth/link/status', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 401) {
      return { ok: false, reason: 'not_signed_in' };
    }

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, reason: 'status_error', status: res.status, text };
    }

    const profile = await res.json();
    const twitchLinked = !!profile?.twitchLinked;

    if (twitchLinked || !required) {
      return { ok: true, linked: twitchLinked };
    }

    const shouldLink = typeof window !== 'undefined'
      ? window.confirm('Twitch is required for game features. Connect Twitch now?')
      : false;

    if (!shouldLink) {
      return { ok: false, reason: 'user_declined' };
    }

    window.location.href = '/login.html?twitch=1';
    return { ok: true, linkingStarted: true };
  } catch (error) {
    console.error('Failed to check Twitch link status', error);
    return { ok: false, reason: 'network_error', error };
  }
}
