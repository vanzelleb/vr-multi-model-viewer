import { importModelToScene } from './model-import.js';
import { addDownloadedModel, getDownloadedModels, deleteDownloadedModel } from './storage.js';

export async function renderDownloadedModels() {
    const downloadedList = document.getElementById('models-list');
    const aframeDiv = document.getElementById('aframe');

    const models = await getDownloadedModels(); downloadedList.innerHTML = '';
    if (!models.length) {
        downloadedList.innerHTML = 'No models downloaded yet.';
        aframeDiv.classList.remove('visible');
        return;
    }

    aframeDiv.classList.add('visible');

    models.forEach((m, idx) => {
        const div = document.createElement('div');
        div.className = 'model-item';
        div.innerHTML = `
          ${m.thumbnail ? `<img src="${m.thumbnail}" alt="${m.name}" />` : ''}
          <div>
            <span class="skfb-attrib">
              <a href="https://sketchfab.com/3d-models/${m.uid}" target="_blank" rel="noopener">${m.name}</a>
              by <a href="${m.artistUrl}" target="_blank" rel="noopener">${m.artist}</a>
              licensed under <a href="${m.licenseUrl || '#'}" target="_blank" rel="noopener">${m.license.label || 'Unknown License'}</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
            </span>
            <span>${(m.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        <div class="model-actions">
          <button class="btn btn-import" data-model-idx="${idx}">Show</button>
          <button class="btn btn-remove" data-model-idx="${idx}">Delete</button>
        </div>
      `;
        const importBtn = div.querySelector('.btn-import');
        importBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                importBtn.disabled = true;
                const result = await importModelToScene(m);

                if (!result.success) {
                    throw new Error(result.error || 'Import failed');
                }
            } catch (err) {
                alert('Import failed:', err);
            }
        });
        
        div.querySelector('.btn-remove').addEventListener('click', async () => {
            console.log('Delete button clicked for model:', m.uid, m.name);
            await deleteDownloadedModel(m.uid);
            await renderDownloadedModels();
        });
        downloadedList.appendChild(div);
    });
}
