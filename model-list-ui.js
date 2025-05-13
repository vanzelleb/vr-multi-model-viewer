import { importModelToScene } from './model-import.js';
import { getDownloadedModels, saveDownloadedModels } from './storage.js';

export function renderDownloadedModels() {
  const downloadedList = document.getElementById('downloaded-models-list');
  const models = getDownloadedModels();
  downloadedList.innerHTML = '';
  if (!models.length) {
    downloadedList.innerHTML = '<li style="color:var(--text-muted);padding:1rem;">No models downloaded yet.</li>';
    return;
  }
  models.forEach((m, idx) => {
    // Defensive: ensure licenseUrl is a string
    const licenseUrl = typeof m.licenseUrl === 'string' ? m.licenseUrl : 'https://creativecommons.org/licenses/by/4.0/';
    // Defensive: ensure artistUrl is a string
    const artistUrl = typeof m.artistUrl === 'string' ? m.artistUrl : '#';
    // Defensive: ensure thumbnail is a string
    const thumbnail = typeof m.thumbnail === 'string' ? m.thumbnail : '';
    const li = document.createElement('li');
    li.className = 'model-item';
    li.innerHTML = `
      <div class="model-thumb-row" style="display:flex;align-items:center;gap:1rem;">
        <img src="${thumbnail}" alt="${m.name}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'" />
        <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
          <h3 class="model-name">${m.name}</h3>
          <span class="model-size">${(m.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
      </div>
      <div class="model-actions">
        <button class="btn btn-import" data-model-idx="${idx}">Import</button>
        <button class="btn btn-remove" data-model-idx="${idx}">Delete</button>
      </div>
      <div class="sketchfab-result-attribution">
        <span class="skfb-attrib">
          <a href="https://sketchfab.com/3d-models/${m.uid}" target="_blank" rel="noopener">${m.name}</a>
          by <a href="${artistUrl}" target="_blank" rel="noopener">${m.artist}</a>
          licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
        </span>
      </div>
    `;
    // Attach event listeners robustly
    li.querySelector('.btn-import').addEventListener('click', () => {
      // Defensive: always log and call import
      console.log('Import button clicked for model:', m.uid, m.name, m);
      importModelToScene(m);
    });
    li.querySelector('.btn-remove').addEventListener('click', () => {
      console.log('Delete button clicked for model:', m.uid, m.name);
      const updated = getDownloadedModels().filter(mm => mm.uid !== m.uid);
      saveDownloadedModels(updated);
      renderDownloadedModels();
    });
    downloadedList.appendChild(li);
  });
}
