/**
 * Login page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const passwordStrength = document.getElementById('password-strength');
  const errorMessage = document.getElementById('error-message');
  const loginBtn = document.getElementById('login-btn');
  const twitchLoginBtn = document.getElementById('twitch-login-btn');

  // Password strength indicator
  passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    passwordStrength.className = 'password-strength';
    if (strength <= 2) {
      passwordStrength.classList.add('weak');
    } else if (strength <= 3) {
      passwordStrength.classList.add('fair');
    } else {
      passwordStrength.classList.add('good');
    }
  });

  // Login form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    if (!password) {
      Toast.error('Password required');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
      const result = await apiCall('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (result.token) {
        setToken(result.token);
        Toast.success('Login successful!');
        setTimeout(() => {
          window.location.href = '/admin2.html';
        }, 500);
      }
    } catch (err) {
      errorMessage.textContent = err.message;
      errorMessage.style.display = 'block';
      Toast.error('Login failed: ' + err.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  });

  // Twitch login button
  twitchLoginBtn.addEventListener('click', () => {
    // In a real app, this would redirect to Twitch OAuth
    Toast.info('Twitch login not yet configured');
  });

  const themeBtn = document.getElementById('login-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = toggleTheme();
      Toast.info(`Theme: ${next}`);
    });
  }
});
