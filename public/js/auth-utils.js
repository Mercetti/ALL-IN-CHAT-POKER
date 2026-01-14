/**
 * Authentication utilities for client-side pages
 */

async function enforceAuthenticatedPage({ page }) {
  // Check if user is authenticated using secure storage
  const tokenData = await window.secureTokenStorage.getToken();
  
  if (!tokenData) {
    // Redirect to login with page context
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}&page=${page}`;
    return;
  }
  
  // Verify token validity (simplified example)
  // In a real implementation, you'd validate the token with the server
  if (process.env.NODE_ENV === 'development') {
    console.log(`Authenticated access to ${page} page`);
  }
}

async function setAuthToken(token, metadata = {}) {
  return await window.secureTokenStorage.setToken(token, metadata);
}

async function getAuthToken() {
  const tokenData = await window.secureTokenStorage.getToken();
  return tokenData ? tokenData.token : null;
}

async function removeAuthToken() {
  window.secureTokenStorage.removeToken();
}

async function isTokenValid() {
  return await window.secureTokenStorage.isTokenValid();
}

export { 
  enforceAuthenticatedPage, 
  setAuthToken, 
  getAuthToken, 
  removeAuthToken, 
  isTokenValid 
};
