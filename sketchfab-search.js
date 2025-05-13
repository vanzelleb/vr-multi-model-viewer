// Sketchfab search and download logic
import { getAccessToken } from './sketchfab-auth.js';
import { addDownloadedModel, renderDownloadedModels } from './sketchfab-storage.js';
import * as zipJs from 'https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.7.61/+esm';

let currentPage = 1;
let lastQuery = '';
let lastResults = [];
const MODELS_PER_PAGE = 24;
let lastNextUrl = null;
let lastPrevUrl = null;

export async function searchSketchfab(query, resultsDiv, page = 1) {
  const token = getAccessToken();
  if (!token) return;
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const url = `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true&sort_by=likeCount&file_format=glb&archives_flavours=true&count=24${page > 1 ? `&cursor=${(page-1)*24}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  lastQuery = query;
  lastResults = data.results;
  lastNextUrl = data.next || null;
  lastPrevUrl = data.previous || null;
  renderSearchResults(resultsDiv);
}

function renderSearchResults(resultsDiv) {
  resultsDiv.innerHTML = '';
  const start = 0; // Always start at 0 for paginated API
  const pageResults = lastResults;
  pageResults.forEach(model => {
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
    // Attach download handlers for each .glb (fix: use addEventListener instead of assigning onclick)
    el.querySelectorAll('.sketchfab-result-download').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-glb-idx'), 10);
      btn.addEventListener('click', () => downloadAndSaveModel(model, glbFiles[idx]));
    });
    resultsDiv.appendChild(el);
  });
  // Pagination controls using API-provided next/previous links
  const nav = document.createElement('div');
  nav.className = 'sketchfab-pagination';
  nav.style = 'display:flex;justify-content:center;gap:1rem;margin-top:1.5rem;';
  if (lastNextUrl) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.onclick = () => fetchNextPage(lastNextUrl, resultsDiv);
    nav.appendChild(nextBtn);
  }
  if (lastPrevUrl) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.onclick = () => fetchNextPage(lastPrevUrl, resultsDiv);
    nav.appendChild(prevBtn);
  }
  if (nav.childNodes.length) resultsDiv.appendChild(nav);
}

async function fetchNextPage(url, resultsDiv) {
  const token = getAccessToken();
  if (!token) return;
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  lastResults = data.results;
  lastNextUrl = data.next || null;
  lastPrevUrl = data.previous || null;
  renderSearchResults(resultsDiv);
}

async function downloadAndSaveModel(model, glbFile) {
  console.log('Download: Start for model', model.uid, model.name);
  const token = getAccessToken();
  if (!token) {
    console.log('Download: No access token');
    return;
  }
  // 1. Get the download info (contains a signed URL)
  console.log('Download: Fetching download info...');
  const downloadInfoRes = await fetch(`https://api.sketchfab.com/v3/models/${model.uid}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!downloadInfoRes.ok) {
    console.log('Download: Failed to get download info', downloadInfoRes.status);
    alert('Failed to get download info for this model.');
    return;
  }
  const downloadInfo = await downloadInfoRes.json();
  console.log('Download: Download info received', downloadInfo);
  const zipUrl = downloadInfo.gltf.url;

  // 2. Download and extract the ZIP archive using zip.js
  console.log('Download: Fetching ZIP archive from', zipUrl);
  const response = await fetch(zipUrl);
  if (!response.ok) {
    console.log('Download: Failed to download model archive', response.status);
    alert('Failed to download model archive.');
    return;
  }
  const blob = await response.blob();
  console.log('Download: ZIP archive fetched, size', blob.size);
  const reader = new zipJs.ZipReader(new zipJs.BlobReader(blob));
  const entries = await reader.getEntries();
  console.log('Download: ZIP entries', entries.map(e => e.filename));
  // Map filenames to Blobs
  const fileBlobs = {};
  let sceneGltfEntry = null;
  let sceneGlbEntry = null;
  for (const entry of entries) {
    if (!entry.directory) {
      console.log('Download: Extracting', entry.filename);
      const data = await entry.getData(new zipJs.BlobWriter());
      fileBlobs[entry.filename] = data;
      if (entry.filename.endsWith('.gltf')) sceneGltfEntry = entry;
      if (entry.filename.endsWith('.glb')) sceneGlbEntry = entry;
      console.log('Download: Blob created for', entry.filename, data);
    }
  }
  let mainFile = null;
  let mainFileName = null;
  if (sceneGltfEntry) {
    console.log('Download: Patching .gltf file', sceneGltfEntry.filename);
    const gltfText = await sceneGltfEntry.getData(new zipJs.TextWriter());
    let json = JSON.parse(gltfText);
    if (json.buffers) {
      for (let i = 0; i < json.buffers.length; i++) {
        if (fileBlobs[json.buffers[i].uri]) {
          console.log('Download: Rewriting buffer URI', json.buffers[i].uri);
          json.buffers[i].uri = json.buffers[i].uri; // Keep the filename for later
        }
      }
    }
    if (json.images) {
      for (let i = 0; i < json.images.length; i++) {
        if (fileBlobs[json.images[i].uri]) {
          console.log('Download: Rewriting image URI', json.images[i].uri);
          json.images[i].uri = json.images[i].uri; // Keep the filename for later
        }
      }
    }
    const updatedBlob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    mainFile = updatedBlob;
    mainFileName = sceneGltfEntry.filename;
    fileBlobs[mainFileName] = updatedBlob;
    console.log('Download: Patched .gltf Blob', mainFileName, mainFile);
  } else if (sceneGlbEntry) {
    mainFile = fileBlobs[sceneGlbEntry.filename];
    mainFileName = sceneGlbEntry.filename;
    console.log('Download: Using .glb Blob', mainFileName, mainFile);
  }
  await reader.close();
  if (!mainFile || !mainFileName) {
    console.log('Download: Could not extract a main .gltf or .glb file from the archive.');
    alert('Could not extract a main .gltf or .glb file from the archive.');
    return;
  }
  // 3. Save the model info and the main file as a base64 string in localStorage
  const reader2 = new FileReader();
  reader2.onload = function() {
    const base64 = reader2.result;
    addDownloadedModel({
      uid: model.uid,
      name: model.name,
      artist: model.user.displayName,
      artistUrl: model.user.profileUrl || '#',
      license: model.license || 'CC BY 4.0',
      licenseUrl: model.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
      glbFileName: mainFileName,
      glbBase64: base64,
      size: glbFile.size
    });
    renderDownloadedModels();
    console.log('Download: Saved model to storage', model.uid, mainFileName);
  };
  reader2.onerror = function(e) {
    console.log('Download: Error reading blob as base64', e);
    alert('Failed to save model file.');
  };
  reader2.readAsDataURL(mainFile);
  console.log('Download: Done for model', model.uid);
}
