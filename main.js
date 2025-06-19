import { handleOAuthRedirect, loginWithSketchfab } from './sketchfab-auth.js';
import { searchSketchfab } from './sketchfab-search.js';
import { renderDownloadedModels } from './model-list-ui.js';
import { addDownloadedModel } from './storage.js';


function showSearch() {
    document.getElementById('sketchfab-login-container').style.display = 'none';
    document.getElementById('sketchfab-search-container').style.display = 'flex';
}
function showLogin() {
    document.getElementById('sketchfab-login-container').style.display = 'block';
    document.getElementById('sketchfab-search-container').style.display = 'none';
}

async function renderFile(fileOrFilename) {
    let blob, name, size;

    if (typeof fileOrFilename === 'string') {
        // Load from URL (website file)
        const response = await fetch(fileOrFilename);
        if (!response.ok) {
            alert('Could not load ' + fileOrFilename);
            return;
        }
        blob = await response.blob();
        name = fileOrFilename.split('/').pop();
        size = blob.size;
    } else if (fileOrFilename instanceof File) {
        // Load from user-selected file
        blob = fileOrFilename;
        name = fileOrFilename.name;
        size = fileOrFilename.size;
    } else {
        alert('Invalid input to renderFile');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function () {
        const base64 = reader.result;
        const model = {
            uid: name, // You may want to generate a unique ID for user files
            name: name,
            artist: '#',
            artistUrl: '#',
            license: '#',
            licenseUrl: '#',
            files: { [name]: base64 },
            mainFileName: name,
            size: size,
            thumbnail: ''
        };
        await addDownloadedModel(model);
        if (typeof renderDownloadedModels === 'function') renderDownloadedModels();
    };
    reader.readAsDataURL(blob);
}


document.addEventListener('DOMContentLoaded', () => {
    handleOAuthRedirect(showSearch, showLogin);
    const loginBtn = document.getElementById('sketchfab-login-btn');
    if (loginBtn) {
        loginBtn.onclick = loginWithSketchfab;
    }

    // Upload .glb model button logic
    const uploadBtn = document.getElementById('upload-model-btn');
    const uploadInput = document.getElementById('upload-model-input');
    if (uploadBtn && uploadInput) {
        uploadBtn.addEventListener('click', () => {
            uploadInput.click();
        });
        uploadInput.addEventListener('change', () => {
            const file = uploadInput.files[0];
            if (file) {
                renderFile(file); // Call your function here
            }
        });
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

    // easter egg
    const elem = document.getElementsByTagName("a-scene").item(0)
    let clickCount = 0;
    elem.addEventListener('click', async () => {
        clickCount++;
        if (clickCount === 10) {
            await renderFile('piece.glb');
            alert('Easter egg found');
        }
    })
})
