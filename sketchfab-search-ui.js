import { searchSketchfabApi, fetchPaginatedResults, fetchDownloadInfo } from './sketchfab-api.js';
import { extractModelZip } from './sketchfab-download.js';
import { addDownloadedModel } from './storage.js';

let lastResults = [];
let lastNextUrl = null;
let lastPrevUrl = null;

export async function searchSketchfab(query, resultsDiv, page = 1) {
    resultsDiv.innerHTML = '<div>Loading...</div>';
    try {
        const data = await searchSketchfabApi(query, page);
        lastResults = data.results;
        lastNextUrl = data.next || null;
        lastPrevUrl = data.previous || null;
        renderSearchResults(resultsDiv);
    } catch (e) {
        resultsDiv.innerHTML = `<div>Error: ${e.message}</div>`;
    }
}

function renderSearchResults(resultsDiv) {
    resultsDiv.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'sketchfab-results-grid';

    lastResults.forEach(model => {
        // Find the smallest .glb file
        let glbFiles = (model.archives && model.archives.glb) ? model.archives.glb : [];
        let smallestGlb = null;
        if (glbFiles.length) {
            smallestGlb = glbFiles.reduce((min, file) => (!min || file.size < min.size) ? file : min, null);
        }

        const attribution = `
      <span class="skfb-attrib">
        <a href="https://sketchfab.com/3d-models/${model.slug || model.uid}" target="_blank" rel="noopener">${model.name}</a>
        by <a href="${model.user.profileUrl || '#'}" target="_blank" rel="noopener">${model.user.displayName}</a>
        licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
      </span>
    `;

        const el = document.createElement('div');
        el.className = 'sketchfab-result-card-grid';
        let downloadHtml = '';

        if (smallestGlb) {
            const sizeMB = (smallestGlb.size / (1024 * 1024)).toFixed(2);
            downloadHtml = `
        <button class="sketchfab-result-download" data-glb-idx="${glbFiles.indexOf(smallestGlb)}">Download</button>
        <div class="sketchfab-result-size">${sizeMB} MB</div>
      `;
        } else {
            downloadHtml = '<div class="sketchfab-result-size skfb-unavailable">No .glb available</div>';
        }

        el.innerHTML = `
      <div class="sketchfab-result-thumb-cell">
        <img src="${model.thumbnails.images[0].url}" alt="${model.name}" class="sketchfab-result-thumb" loading="lazy" />
      </div>
      <div class="sketchfab-result-title-cell">
        <div class="sketchfab-result-title">${model.name}</div>
      </div>
      <div class="sketchfab-result-artist-cell">
        <div class="sketchfab-result-artist">by ${model.user.displayName}</div>
      </div>
      <div class="sketchfab-result-download-cell">${downloadHtml}</div>
      <div class="sketchfab-result-attribution-cell">
        <div class="sketchfab-result-attribution">${attribution}</div>
      </div>
    `;

        if (smallestGlb) {
            el.querySelector('.sketchfab-result-download').addEventListener('click', async () => {
                try {
                    const btn = el.querySelector('.sketchfab-result-download');
                    btn.textContent = 'Downloading...';
                    btn.disabled = true;

                    const downloadInfo = await fetchDownloadInfo(model.uid);
                    const zipUrl = downloadInfo.gltf.url;
                    const { fileBase64s, mainFileName } = await extractModelZip(zipUrl);

                    addDownloadedModel({
                        uid: model.uid,
                        name: model.name,
                        artist: model.user.displayName,
                        artistUrl: model.user.profileUrl || '#',
                        license: model.license || 'CC BY 4.0',
                        licenseUrl: model.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
                        files: fileBase64s,
                        mainFileName,
                        size: smallestGlb.size,
                        thumbnail: (model.thumbnails && model.thumbnails.images && model.thumbnails.images[0] && model.thumbnails.images[0].url) || ''
                    });

                    btn.textContent = 'See My Models';
                    btn.disabled = false;
                    btn.classList.remove('sketchfab-result-download');
                    btn.classList.add('sketchfab-result-goto');
                    btn.onclick = () => window.location.href = 'models.html';
                } catch (e) {
                    alert('Download failed: ' + e.message);
                    const btn = el.querySelector('.sketchfab-result-download');
                    btn.textContent = 'Download';
                    btn.disabled = false;
                }
            });
        }
        grid.appendChild(el);
    });
    resultsDiv.appendChild(grid);

    // Add pagination container
    const nav = document.createElement('div');
    nav.className = 'sketchfab-pagination';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Search results pagination');
    if (lastPrevUrl) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.setAttribute('aria-label', 'Previous page');
        prevBtn.onclick = () => fetchPage(lastPrevUrl, resultsDiv);
        nav.appendChild(prevBtn);
    }
    if (lastNextUrl) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.setAttribute('aria-label', 'Next page');
        nextBtn.onclick = () => fetchPage(lastNextUrl, resultsDiv);
        nav.appendChild(nextBtn);
    }

    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'sketchfab-pagination-container';
    paginationContainer.appendChild(nav);
    if (nav.childNodes.length) resultsDiv.parentNode.insertBefore(paginationContainer, resultsDiv.nextSibling);
}

async function fetchPage(url, resultsDiv) {
    resultsDiv.innerHTML = '<div>Loading...</div>';
    try {
        const data = await fetchPaginatedResults(url);
        lastResults = data.results;
        lastNextUrl = data.next || null;
        lastPrevUrl = data.previous || null;
        renderSearchResults(resultsDiv);
    } catch (e) {
        resultsDiv.innerHTML = `<div>Error: ${e.message}</div>`;
    }
}
