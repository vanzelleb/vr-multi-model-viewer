// Sketchfab search and download logic
import { getAccessToken } from './sketchfab-auth.js';
import { addDownloadedModel, renderDownloadedModels } from './sketchfab-storage.js';

export async function searchSketchfab(query, resultsDiv) {
  const token = getAccessToken();
  if (!token) return;
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  resultsDiv.innerHTML = '';
  data.results.forEach(model => {
    const smallestGlb = getSmallestGlbFile(model);
    const sizeMB = smallestGlb ? (smallestGlb.size / (1024 * 1024)).toFixed(2) : null;
    const el = document.createElement('div');
    el.className = 'sketchfab-result';
    el.innerHTML = `
      <img src="${model.thumbnails.images[0].url}" alt="${model.name}" />
      <div class="sketchfab-result-title">${model.name}</div>
      <div class="sketchfab-result-artist">by ${model.user.displayName}</div>
      ${sizeMB ? `<div class="sketchfab-result-size">${sizeMB} MB</div>` : ''}
      <button class="sketchfab-result-download" ${smallestGlb ? '' : 'disabled'}>Download</button>
    `;
    el.querySelector('.sketchfab-result-download').onclick = () => {
      if (smallestGlb) downloadAndSaveModel(model, smallestGlb);
    };
    resultsDiv.appendChild(el);
  });
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
