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
  lastResults.forEach(model => {
    const glbFiles = (model.archives && model.archives.glb) ? model.archives.glb : [];
    const attribution = `
      <span class="skfb-attrib">
        <a href="https://sketchfab.com/3d-models/${model.slug || model.uid}" target="_blank" rel="noopener">${model.name}</a>
        by <a href="${model.user.profileUrl || '#'}" target="_blank" rel="noopener">${model.user.displayName}</a>
        licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
      </span>
    `;
    const el = document.createElement('div');
    el.className = 'sketchfab-result';
    let glbListHtml = '';
    if (glbFiles.length) {
      glbListHtml = '<div class="sketchfab-glb-list">';
      glbFiles.forEach((file, idx) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        glbListHtml += `
          <div class="sketchfab-glb-item">
            <span>GLB #${idx + 1}: ${sizeMB} MB</span>
            <button class="sketchfab-result-download" data-glb-idx="${idx}">Download</button>
          </div>
        `;
      });
      glbListHtml += '</div>';
    } else {
      glbListHtml = '<div class="sketchfab-result-size skfb-unavailable">No .glb available</div>';
    }
    let totalSize = 0;
    glbFiles.forEach(file => { totalSize += file.size || 0; });
    let sizeInfo = '';
    if (glbFiles.length) {
      sizeInfo = `<div class="sketchfab-result-size">Total .glb size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB</div>`;
    }
    el.innerHTML = `
      <img src="${model.thumbnails.images[0].url}" alt="${model.name}" />
      <div class="sketchfab-result-title">${model.name}</div>
      <div class="sketchfab-result-artist">by ${model.user.displayName}</div>
      ${glbListHtml}
      ${sizeInfo}
      <div class="sketchfab-result-attribution">${attribution}</div>
    `;
    el.querySelectorAll('.sketchfab-result-download').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-glb-idx'), 10);
      btn.addEventListener('click', async () => {
        try {
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
            size: glbFiles[idx].size
          });
          btn.textContent = 'See My Models';
          btn.classList.remove('sketchfab-result-download');
          btn.classList.add('sketchfab-result-goto');
          btn.onclick = () => window.location.href = 'models.html';
        } catch (e) {
          alert('Download failed: ' + e.message);
        }
      });
    });
    resultsDiv.appendChild(el);
  });
  // Pagination controls
  const nav = document.createElement('div');
  nav.className = 'sketchfab-pagination';
  nav.style = 'display:flex;justify-content:center;gap:1rem;margin-top:1.5rem;';
  if (lastNextUrl) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.onclick = () => fetchPage(lastNextUrl, resultsDiv);
    nav.appendChild(nextBtn);
  }
  if (lastPrevUrl) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.onclick = () => fetchPage(lastPrevUrl, resultsDiv);
    nav.appendChild(prevBtn);
  }
  if (nav.childNodes.length) resultsDiv.appendChild(nav);
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
