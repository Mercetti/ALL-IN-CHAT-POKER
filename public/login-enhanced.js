/**
 * Enhanced Login Page JavaScript
 * Modern UX with animations, improved validation, and better error handling
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  applyTheme();
  
  // Initialize components
  initializeRoleSelection();
  initializePasswordToggles();
  initializePasswordStrength();
  initializeFormValidation();
  initializeAnimations();
  
  // Existing login functionality
  initializeAuth();
});

// ===== ROLE SELECTION =====
function initializeRoleSelection() {
  const roleButtons = document.querySelectorAll('.role-option');
  const roleNote = document.getElementById('role-note');
  let desiredRole = localStorage.getItem('loginRole') || 'player';

  function setRole(role) {
    desiredRole = role;
    localStorage.setItem('loginRole', role);
    
    // Update UI
    roleButtons.forEach(btn => {
      const isActive = btn.dataset.role === role;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });
    
    // Update note
    if (roleNote) {
      roleNote.textContent = role === 'streamer'
        ? '🎥 Streamers get advanced controls, custom audio, and admin dashboard access.'
        : '🎮 Players can join games, customize profiles, and enjoy the streaming experience.';
    }
    
    // Add animation
    animateRoleSelection(role);
  }

  if (roleButtons.length) {
    setRole(desiredRole);
    roleButtons.forEach(btn => {
      btn.addEventListener('click', () => setRole(btn.dataset.role || 'player'));
    });
  }
}

function animateRoleSelection(role) {
  const activeBtn = document.querySelector(`.role-option[data-role="${role}"]`);
  if (activeBtn) {
    activeBtn.style.animation = 'none';
    setTimeout(() => {
      activeBtn.style.animation = 'pulse 0.5s ease';
    }, 10);
  }
}

// ===== PASSWORD TOGGLES =====
function initializePasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const icon = button.querySelector('.toggle-icon');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
      } else {
        input.type = 'password';
        icon.textContent = '👁️';
      }
      
      // Add animation
      button.style.transform = 'scale(0.9)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 100);
    });
  });
}

// ===== PASSWORD STRENGTH =====
function initializePasswordStrength() {
  const passwordInputs = document.querySelectorAll('input[type="password"][name*="password"]');
  
  passwordInputs.forEach(input => {
    input.addEventListener('input', () => {
      const strength = calculatePasswordStrength(input.value);
      updatePasswordStrength(strength, input);
    });
  });
}

function calculatePasswordStrength(password) {
  if (!password) return { strength: 0, label: 'weak' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  Object.values(checks).forEach(passed => {
    if (passed) score++;
  });
  
  if (score <= 2) return { strength: 1, label: 'weak' };
  if (score <= 3) return { strength: 2, label: 'fair' };
  return { strength: 3, label: 'good' };
}

function updatePasswordStrength(strength, input) {
  const strengthElement = input.parentElement.querySelector('.password-strength');
  if (!strengthElement) return;
  
  strengthElement.className = `password-strength ${strength.label}`;
  
  // Add color to input border
  input.style.borderColor = strength.label === 'weak' ? 'rgba(220, 53, 69, 0.5)' :
                           strength.label === 'fair' ? 'rgba(255, 193, 7, 0.5)' :
                           'rgba(40, 167, 69, 0.5)';
}

// ===== FORM VALIDATION =====
function initializeFormValidation() {
  const forms = document.querySelectorAll('.auth-form');
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateInput(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          validateInput(input);
        }
      });
    });
    
    form.addEventListener('submit', (e) => {
      if (!validateForm(form)) {
        e.preventDefault();
        shakeForm(form);
      }
    });
  });
}

function validateInput(input) {
  const value = input.value.trim();
  let isValid = true;
  let message = '';
  
  if (input.hasAttribute('required') && !value) {
    isValid = false;
    message = 'This field is required';
  } else if (input.type === 'email' && value && !isValidEmail(value)) {
    isValid = false;
    message = 'Please enter a valid email';
  } else if (input.name.includes('password') && value && value.length < 8) {
    isValid = false;
    message = 'Password must be at least 8 characters';
  }
  
  updateInputValidation(input, isValid, message);
  return isValid;
}

function validateForm(form) {
  const inputs = form.querySelectorAll('input[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!validateInput(input)) {
      isValid = false;
    }
  });
  
  return isValid;
}

function updateInputValidation(input, isValid, message) {
  input.classList.toggle('error', !isValid);
  input.classList.toggle('valid', isValid);
  
  // Remove existing error message
  const existingError = input.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add error message if invalid
  if (!isValid && message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    input.parentElement.appendChild(errorElement);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shakeForm(form) {
  form.style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    form.style.animation = '';
  }, 500);
}

// ===== ANIMATIONS =====
function initializeAnimations() {
  // Animate elements on load
  const elements = document.querySelectorAll('.login-card > *');
  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => {
      el.style.transition = 'all 0.5s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, index * 100);
  });
  
  // Add hover effects to buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
    });
    button.addEventListener('mouseleave', () => {
      if (!button.classList.contains('active')) {
        button.style.transform = 'translateY(0)';
      }
    });
  });
}

// ===== ENHANCED TOAST SYSTEM =====
class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    this.toasts = new Map();
  }
  
  show(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
      this.remove(toast);
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
      this.remove(toast);
    });
    
    return toast;
  }
  
  remove(toast) {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  }
  
  error(message, duration) {
    return this.show(message, 'error', duration || 8000);
  }
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

const Toast = new ToastManager();

// ===== ENHANCED AUTH FUNCTIONALITY =====
function initializeAuth() {
  // Theme toggle
  const themeBtn = document.getElementById('login-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = toggleTheme();
      updateThemeIcon(next);
      Toast.info(`Theme changed to ${next}`);
    });
  }
  
  // Reset session
  const resetBtn = document.getElementById('reset-session-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your session? You will need to sign in again.')) {
        clearToken();
        clearUserToken();
        Toast.info('Session reset. Please sign in again.');
        refreshLinkStatus();
      }
    });
  }
  
  // Initialize existing auth functionality
  initializeExistingAuth();
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

function initializeExistingAuth() {
  // This would contain all the existing auth logic from login.js
  // For now, we'll just add some enhancements
  
  // Enhanced forgot password
  const forgotBtn = document.getElementById('forgot-password-btn');
  const resetPanel = document.getElementById('reset-panel');
  
  if (forgotBtn && resetPanel) {
    forgotBtn.addEventListener('click', () => {
      const isHidden = resetPanel.style.display === 'none' || !resetPanel.style.display;
      resetPanel.style.display = isHidden ? 'block' : 'none';
      
      if (isHidden) {
        resetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        Toast.info('Enter your username to receive a reset code');
      }
    });
  }
  
  // Discord link (placeholder)
  const discordBtn = document.getElementById('discord-login-btn');
  if (discordBtn) {
    discordBtn.addEventListener('click', () => {
      Toast.info('Discord integration coming soon! 🚀');
    });
  }
  
  // Add loading states to all forms
  const forms = document.querySelectorAll('.auth-form');
  forms.forEach(form => {
    form.addEventListener('submit', () => {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Processing...';
      }
    });
  });
}

// ===== UTILITY FUNCTIONS =====
function refreshLinkStatus() {
  const statusEl = document.getElementById('link-status');
  if (!statusEl) return;
  
  const token = getUserToken();
  if (!token) {
    statusEl.innerHTML = '🔒 Not signed in yet';
    return;
  }
  
  // Simulate link status check
  statusEl.innerHTML = '🔗 Checking account links...';
  
  setTimeout(() => {
    statusEl.innerHTML = '✅ Account ready • Link Twitch for full features';
  }, 1000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-message {
    color: var(--color-danger);
    font-size: 0.8rem;
    margin-top: var(--spacing-xs);
    animation: slideIn 0.3s ease;
  }
  
  input.error {
    border-color: var(--color-danger) !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
  }
  
  input.valid {
    border-color: var(--color-success) !important;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1) !important;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;
document.head.appendChild(style);

// Export for use in other scripts
window.Toast = Toast;
window.refreshLinkStatus = refreshLinkStatus;
