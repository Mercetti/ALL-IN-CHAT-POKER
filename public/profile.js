/**
 * User profile page JavaScript
 */

let profileData = null;
let hasUnsavedChanges = false;

document.addEventListener('DOMContentLoaded', async () => {
  applyTheme();
  // Get username from URL or use default
  const params = new URLSearchParams(window.location.search);
  const username = params.get('user') || 'guest';

  await loadProfile(username);
  setupEventListeners();
});

async function loadProfile(username) {
  try {
    const data = await apiCall(`/profile?login=${encodeURIComponent(username)}`);

    profileData = {
      username: data?.profile?.login || username,
      display_name: data?.profile?.display_name || username,
      theme: data?.profile?.settings?.theme || 'dark',
      startingChips: data?.profile?.settings?.startingChips || 1000,
      avatarUrl: data?.profile?.settings?.avatarUrl || '',
      stats: data?.stats || {},
      balance: data?.balance,
    };

    updateForm();
    updatePreview();
  } catch (err) {
    Toast.error('Failed to load profile: ' + err.message);
  }
}

function updateForm() {
  if (!profileData) return;

  document.getElementById('profile-username').value = profileData.username;
  document.getElementById('profile-display-name').value = profileData.display_name || profileData.username;
  document.getElementById('profile-theme').value = profileData.theme || 'dark';
  document.getElementById('profile-starting-chips').value = profileData.startingChips || 1000;
}

function updatePreview() {
  if (!profileData) return;

  document.getElementById('preview-username').textContent = profileData.username;
  document.getElementById('preview-display-name').textContent = profileData.display_name || profileData.username;
  document.getElementById('preview-theme').textContent = profileData.theme || 'dark';
  document.getElementById('preview-chips').textContent = profileData.startingChips || 1000;
  const avatar = document.getElementById('preview-avatar');
  if (avatar) {
    avatar.src = profileData.avatarUrl || 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-profile_image.png';
  }

  if (profileData.stats) {
    document.getElementById('preview-rounds-played').textContent = profileData.stats.roundsPlayed || 0;
    document.getElementById('preview-rounds-won').textContent = profileData.stats.roundsWon || 0;
    document.getElementById('preview-total-won').textContent = profileData.stats.totalWon || 0;
    document.getElementById('preview-biggest-win').textContent = profileData.stats.biggestWin || 0;
  }
}

function setupEventListeners() {
  const form = document.getElementById('profile-form');
  const inputs = form.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    input.addEventListener('change', () => {
      hasUnsavedChanges = true;
      updateUnsavedWarning();
      updateLivePreview();
    });
  });

  form.addEventListener('submit', saveProfile);

  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Leave anyway?')) {
      return;
    }
    window.history.back();
  });

  const themeBtn = document.getElementById('profile-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = toggleTheme();
      Toast.info(`Theme: ${next}`);
    });
  }
}

function updateLivePreview() {
  document.getElementById('preview-display-name').textContent = document.getElementById('profile-display-name').value || profileData.username;
  document.getElementById('preview-theme').textContent = document.getElementById('profile-theme').value;
  document.getElementById('preview-chips').textContent = document.getElementById('profile-starting-chips').value;
}

function updateUnsavedWarning() {
  const warning = document.getElementById('unsaved-warning');
  warning.style.display = hasUnsavedChanges ? 'block' : 'none';
}

async function saveProfile(e) {
  e.preventDefault();

  try {
    const updatedData = {
      login: profileData.username,
      display_name: document.getElementById('profile-display-name').value,
      settings: {
        theme: document.getElementById('profile-theme').value,
        startingChips: parseInt(document.getElementById('profile-starting-chips').value, 10),
        avatarUrl: document.getElementById('profile-avatar').value,
      },
    };

    await apiCall('/profile', {
      method: 'POST',
      body: JSON.stringify(updatedData),
    });

    profileData.display_name = updatedData.display_name;
    profileData.theme = updatedData.settings.theme;
    profileData.startingChips = updatedData.settings.startingChips;

    hasUnsavedChanges = false;
    updateUnsavedWarning();
    Toast.success('Profile saved successfully');
  } catch (err) {
    Toast.error('Save failed: ' + err.message);
  }
}

// Warn before leaving if unsaved
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
