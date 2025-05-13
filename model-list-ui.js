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
    const li = document.createElement('li');
    li.className = 'model-item';
    li.innerHTML = `
      <h3 class="model-name">${m.name}</h3>
      <div class="model-credits">
        <a href="${m.artistUrl}" class="artist" target="_blank">by ${m.artist}</a>
        <a href="${m.licenseUrl}" class="license" target="_blank">${m.license}</a>
        <span class="model-size">${(m.size / (1024 * 1024)).toFixed(2)} MB</span>
      </div>
      <div class="model-actions">
        <button class="btn btn-import">Import</button>
        <button class="btn btn-remove">Delete</button>
      </div>
    `;
    li.querySelector('.btn-import').onclick = () => importModelToScene(m);
    li.querySelector('.btn-remove').onclick = () => {
      const updated = getDownloadedModels().filter(mm => mm.uid !== m.uid);
      saveDownloadedModels(updated);
      renderDownloadedModels();
    };
    downloadedList.appendChild(li);
  });
}
