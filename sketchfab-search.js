// Sketchfab search and download logic
import { getAccessToken, loginWithSketchfab } from './sketchfab-auth.js';
import { addDownloadedModel, getDownloadedModels } from './storage.js';
import * as zipJs from 'https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.7.61/+esm';

let lastQuery = '';
let lastResults = [];
let lastNextUrl = null;
let lastPrevUrl = null;

// Only keep downloadAndSaveModel and fetchPage for data logic, not UI
export async function downloadAndSaveModel(model, glbFile) {
  console.log('Download: Start for model', model.uid, model.name);
  const token = getAccessToken();
  console.log('Access token:', token);
  if (!token) {
    alert('No access token found. Please log in again.');
    loginWithSketchfab();
    return;
  }
  // 1. Get the download info (contains a signed URL)
  console.log('Download: Fetching download info...');
  const downloadInfoRes = await fetch(`https://api.sketchfab.com/v3/models/${model.uid}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!downloadInfoRes.ok) {
    const errorText = await downloadInfoRes.text();
    console.log('Download: Failed to get download info', downloadInfoRes.status, errorText);
    alert('Failed to get download info for this model. Status: ' + downloadInfoRes.status + '\\n' + errorText);
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
  // Save all files as base64
  const fileBase64s = {};
  const fileNames = Object.keys(fileBlobs);
  for (const fname of fileNames) {
    const blob = fileBlobs[fname];
    const reader2 = new FileReader();
    // eslint-disable-next-line no-loop-func
    await new Promise((resolve, reject) => {
      reader2.onload = function () {
        fileBase64s[fname] = reader2.result;
        resolve();
      };
      reader2.onerror = reject;
      reader2.readAsDataURL(blob);
    });
  }
  let mainFileName = null;
  if (sceneGltfEntry) {
    mainFileName = sceneGltfEntry.filename;
  } else if (sceneGlbEntry) {
    mainFileName = sceneGlbEntry.filename;
  }
  await reader.close();
  if (!mainFileName) {
    alert('Could not extract a main .gltf or .glb file from the archive.');
    return;
  }
  addDownloadedModel({
    uid: model.uid,
    name: model.name,
    artist: model.user.displayName,
    artistUrl: model.user.profileUrl || '#',
    license: model.license || 'CC BY 4.0',
    licenseUrl: model.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
    files: fileBase64s,
    mainFileName,
    size: glbFile.size,
    thumbnail: (model.thumbnails && model.thumbnails.images && model.thumbnails.images[0] && model.thumbnails.images[0].url) || ''
  });
  console.log('Download: Saved model to storage', model.uid, mainFileName, 'with thumbnail', (model.thumbnails && model.thumbnails.images && model.thumbnails.images[0] && model.thumbnails.images[0].url));
}

async function fetchSketchfabResults(url) {
  const token = getAccessToken();
  if (!token) return null;
  const COMMERCIAL_LICENSES = ['by', 'by-sa', 'by-nd', 'cc0', 'free-st', 'st'];
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('fetchSketchfabResults: API returned', data.results.length, 'items');
  console.log('Sample licenses:', data.results.slice(0, 3).map(m => m.license));
  
  const filteredResults = data.results.filter(model =>
    model.license && COMMERCIAL_LICENSES.includes(model.license.slug)
  );
  console.log('fetchSketchfabResults: Filtered to', filteredResults.length, 'commercial-use items');

  return {
    results: filteredResults,
    next: data.next || null,
    previous: data.previous || null
  };
}

async function fetchAndRenderSketchfab(url, resultsDiv) {
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const data = await fetchSketchfabResults(url);
  if (!data) return;
  lastResults = data.results;
  lastNextUrl = data.next;
  lastPrevUrl = data.previous;
  const downloadedModels = await getDownloadedModels();
  const downloadedUids = new Set(downloadedModels.map(m => m.uid));
  if (window.renderSketchfabSearchResultsUI) {
    window.renderSketchfabSearchResultsUI(
      resultsDiv, lastResults, lastNextUrl, lastPrevUrl, downloadedUids, downloadAndSaveModel
    );
  } else {
    resultsDiv.innerHTML = '<div>UI module not loaded.</div>';
  }
}

export async function searchSketchfab(query, resultsDiv) {
  const url = `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true&sort_by=likeCount&file_format=glb&archives_flavours=true`;
  console.log('searchSketchfab called with url:', url);
  await fetchAndRenderSketchfab(url, resultsDiv);
}

export async function fetchPage(url, resultsDiv) {
  console.log('fetchPage called with url:', url);
  await fetchAndRenderSketchfab(url, resultsDiv);
}

