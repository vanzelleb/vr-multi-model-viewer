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
    console.log('Rendering model in My Models:', m.uid, m.name, m);
    const li = document.createElement('li');
    li.className = 'model-item';
    // Only show model name, artist, license, and thumbnail once
    li.innerHTML = `
      <div class="model-thumb-row">
        <img src="${m.thumbnail || ''}" alt="${m.name}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;margin-right:1rem;" onerror="this.style.display='none'" />
        <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
          <h3 class="model-name">${m.name}</h3>
          <div class="model-credits">
            <a href="${typeof m.artistUrl === 'string' ? m.artistUrl : '#'}" class="artist" target="_blank">by ${m.artist}</a>
            <a href="${typeof m.licenseUrl === 'string' ? m.licenseUrl : 'https://creativecommons.org/licenses/by/4.0/'}" class="license" target="_blank">${m.license}</a>
            <span class="model-size">${(m.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        </div>
      </div>
      <div class="model-actions">
        <button class="btn btn-import">Import</button>
        <button class="btn btn-remove">Delete</button>
      </div>
      <div class="sketchfab-result-attribution">
        <span class="skfb-attrib">
          <a href="https://sketchfab.com/3d-models/${m.uid}" target="_blank" rel="noopener">${m.name}</a>
          by <a href="${typeof m.artistUrl === 'string' ? m.artistUrl : '#'}" target="_blank" rel="noopener">${m.artist}</a>
          licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
        </span>
      </div>
    `;
    li.querySelector('.btn-import').onclick = () => {
      console.log('Import button clicked for model:', m.uid, m.name);
      importModelToScene(m);
    };
    li.querySelector('.btn-remove').onclick = () => {
      console.log('Delete button clicked for model:', m.uid, m.name);
      const updated = getDownloadedModels().filter(mm => mm.uid !== m.uid);
      saveDownloadedModels(updated);
      renderDownloadedModels();
    };
    downloadedList.appendChild(li);
  });
}
