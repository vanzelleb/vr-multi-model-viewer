// Sketchfab search and download logic
import { getAccessToken } from './sketchfab-auth.js';
import { addDownloadedModel, renderDownloadedModels } from './sketchfab-storage.js';

let currentPage = 1;
let lastQuery = '';
let lastResults = [];
const MODELS_PER_PAGE = 20;

export async function searchSketchfab(query, resultsDiv, page = 1) {
  const token = getAccessToken();
  if (!token) return;
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true&per_page=100`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  // Only show models with a downloadable .glb
  const filtered = data.results.filter(model => getSmallestGlbFile(model));
  lastQuery = query;
  lastResults = filtered;
  currentPage = page;
  renderSearchResults(resultsDiv);
}

function renderSearchResults(resultsDiv) {
  resultsDiv.innerHTML = '';
  const start = (currentPage - 1) * MODELS_PER_PAGE;
  const end = start + MODELS_PER_PAGE;
  const pageResults = lastResults.slice(start, end);
  pageResults.forEach(model => {
    const smallestGlb = getSmallestGlbFile(model);
    let sizeMB = null;
    if (smallestGlb && smallestGlb.size) {
      sizeMB = (smallestGlb.size / (1024 * 1024)).toFixed(2);
    }
    // Attribution per Sketchfab standards
    // "Model Name" by Author Name licensed under CC BY 4.0 on Sketchfab
    const attribution = `
      <span class="skfb-attrib">
        <a href="https://sketchfab.com/3d-models/${model.slug || model.uid}" target="_blank" rel="noopener">${model.name}</a>
        by <a href="${model.user.profileUrl || '#'}" target="_blank" rel="noopener">${model.user.displayName}</a>
        licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
      </span>
    `;
    const el = document.createElement('div');
    el.className = 'sketchfab-result';
    el.innerHTML = `
      <img src="${model.thumbnails.images[0].url}" alt="${model.name}" />
      <div class="sketchfab-result-title">${model.name}</div>
      <div class="sketchfab-result-artist">by ${model.user.displayName}</div>
      ${sizeMB ? `<div class="sketchfab-result-size">${sizeMB} MB</div>` : '<div class="sketchfab-result-size skfb-unavailable">No .glb available</div>'}
      <button class="sketchfab-result-download">Download</button>
      <div class="sketchfab-result-attribution">${attribution}</div>
    `;
    el.querySelector('.sketchfab-result-download').onclick = () => downloadAndSaveModel(model, smallestGlb);
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

function getSmallestGlbFile(model) {
  if (!model.archives || !model.archives.gltf) return null;
  const gltfArr = Array.isArray(model.archives.gltf) ? model.archives.gltf : [model.archives.gltf];
  let smallest = null;
  let minSize = Infinity;
  for (const file of gltfArr) {
    if (file.format === 'gltf' && file.size && file.url && file.url.endsWith('.glb') && file.size < minSize) {
      smallest = file;
      minSize = file.size;
    }
  }
  return smallest;
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
