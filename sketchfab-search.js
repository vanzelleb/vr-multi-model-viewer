// Sketchfab search and download logic
import { getAccessToken } from './sketchfab-auth.js';
import { addDownloadedModel, renderDownloadedModels } from './sketchfab-storage.js';

let currentPage = 1;
let lastQuery = '';
let lastResults = [];
const MODELS_PER_PAGE = 24;

export async function searchSketchfab(query, resultsDiv, page = 1) {
  const token = getAccessToken();
  if (!token) return;
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true&sort_by=likeCount&file_format=glb&archives_flavours=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  // No additional filter needed, API already restricts to .glb models
  lastQuery = query;
  lastResults = data.results;
  currentPage = page;
  renderSearchResults(resultsDiv);
}

function renderSearchResults(resultsDiv) {
  resultsDiv.innerHTML = '';
  const start = (currentPage - 1) * MODELS_PER_PAGE;
  const end = start + MODELS_PER_PAGE;
  const pageResults = lastResults.slice(start, end);
  pageResults.forEach(model => {
    // Get .glb archives directly from model.archives.glb
    const glbFiles = (model.archives && model.archives.glb) ? model.archives.glb : [];
    // Attribution per Sketchfab standards
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
    // Show total size of all .glb archives for this model
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
    // Attach download handlers for each .glb
    el.querySelectorAll('.sketchfab-result-download').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-glb-idx'), 10);
      btn.onclick = () => downloadAndSaveModel(model, glbFiles[idx]);
    });
    resultsDiv.appendChild(el);
  });
  // Pagination controls
  const totalPages = Math.ceil(lastResults.length / MODELS_PER_PAGE);
  if (totalPages > 1) {
    const nav = document.createElement('div');
    nav.className = 'sketchfab-pagination';
    nav.style = 'display:flex;justify-content:center;gap:1rem;margin-top:1.5rem;';
    if (currentPage > 1) {
      const prev = document.createElement('button');
      prev.textContent = 'Previous';
      prev.onclick = () => {
        currentPage--;
        renderSearchResults(resultsDiv);
      };
      nav.appendChild(prev);
    }
    nav.appendChild(document.createTextNode(`Page ${currentPage} of ${totalPages}`));
    if (currentPage < totalPages) {
      const next = document.createElement('button');
      next.textContent = 'Next';
      next.onclick = () => {
        currentPage++;
        renderSearchResults(resultsDiv);
      };
      nav.appendChild(next);
    }
    resultsDiv.appendChild(nav);
  }
}

async function downloadAndSaveModel(model, glbFile) {
  addDownloadedModel({
    uid: model.uid,
    name: model.name,
    artist: model.user.displayName,
    artistUrl: model.user.profileUrl || '#',
    license: model.license || 'CC BY 4.0',
    licenseUrl: model.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
    glbUrl: glbFile.url,
    size: glbFile.size
  });
  renderDownloadedModels();
}
