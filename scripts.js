import './aframe-extensions.js';
import { OAUTH_URL, handleOAuthRedirect } from './sketchfab-auth.js';
import { searchSketchfab } from './sketchfab-search.js';
import { renderDownloadedModels } from './sketchfab-storage.js';

const loginBtn = document.getElementById('sketchfab-login-btn');
const loginContainer = document.getElementById('sketchfab-login-container');
const searchContainer = document.getElementById('sketchfab-search-container');
const searchBtn = document.getElementById('sketchfab-search-btn');
const searchInput = document.getElementById('sketchfab-search');
const resultsDiv = document.getElementById('sketchfab-search-results');

function showLogin() {
  loginContainer.style.display = 'block';
  searchContainer.style.display = 'none';
}
function showSearch() {
  loginContainer.style.display = 'none';
  searchContainer.style.display = 'flex';
}

if (loginBtn) {
  loginBtn.onclick = () => {
    window.location.href = OAUTH_URL;
  };
}

window.addEventListener('DOMContentLoaded', () => {
  handleOAuthRedirect(showSearch, showLogin);
  renderDownloadedModels();
});

if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    if (searchInput.value.trim()) {
      searchSketchfab(searchInput.value.trim(), resultsDiv);
    }
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      searchSketchfab(searchInput.value.trim(), resultsDiv);
    }
  });
}