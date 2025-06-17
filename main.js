import { handleOAuthRedirect, loginWithSketchfab } from './sketchfab-auth.js';
import { searchSketchfab } from './sketchfab-search.js';
import { renderDownloadedModels } from './model-list-ui.js';

function showSearch() {
    document.getElementById('sketchfab-login-container').style.display = 'none';
    document.getElementById('sketchfab-search-container').style.display = 'flex';
}
function showLogin() {
    document.getElementById('sketchfab-login-container').style.display = 'block';
    document.getElementById('sketchfab-search-container').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    handleOAuthRedirect(showSearch, showLogin);
    const loginBtn = document.getElementById('sketchfab-login-btn');
    if (loginBtn) {
        loginBtn.onclick = loginWithSketchfab;
    }

    // Attach search logic
    const searchBtn = document.getElementById('sketchfab-search-btn');
    const searchInput = document.getElementById('sketchfab-search');
    const resultsDiv = document.getElementById('sketchfab-search-results');
    function doSearch() {
        const query = searchInput.value.trim();
        if (query) searchSketchfab(query, resultsDiv, 1);
    }
    if (searchBtn) searchBtn.onclick = doSearch;
    if (searchInput) {
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') doSearch();
        });
    }
    renderDownloadedModels();
});