// Sketchfab OAuth logic
export const SKETCHFAB_CLIENT_ID = 'l1SrgifJvXQ3BehACPbq9ykx8Ke02NTYuyjXoLJv';
export const SKETCHFAB_REDIRECT_URI = 'https://combinevr.netlify.app/';
export const OAUTH_URL = `https://sketchfab.com/oauth2/authorize/?response_type=token&client_id=${SKETCHFAB_CLIENT_ID}&redirect_uri=${encodeURIComponent(SKETCHFAB_REDIRECT_URI)}`;

export function getAccessToken() {
  return localStorage.getItem('sketchfabAccessToken') || null;
}

export function setAccessToken(token) {
  localStorage.setItem('sketchfabAccessToken', token);
}

export function handleOAuthRedirect(showSearch, showLogin) {
  const hash = window.location.hash;
  let token = getAccessToken();
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace('#', '?'));
    token = params.get('access_token');
    setAccessToken(token);
    showSearch();
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (token) {
    showSearch();
  } else {
    showLogin();
  }
  return token;
}

export function loginWithSketchfab() {
  window.location.href = OAUTH_URL;
}
