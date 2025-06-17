import { importModelToScene } from './model-import.js';
import { addDownloadedModel, getDownloadedModels, deleteDownloadedModel } from './storage.js';

export async function renderDownloadedModels() {
    const downloadedList = document.getElementById('downloaded-models-list');
    const models = await getDownloadedModels(); downloadedList.innerHTML = '';
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
      <div class="model-thumb-row">
        ${thumbnail ? `<img src="${thumbnail}" alt="${m.name}" />` : ''}
        <div>
                  <span class="skfb-attrib">
          <a href="https://sketchfab.com/3d-models/${m.uid}" target="_blank" rel="noopener">${m.name}</a>
          by <a href="${artistUrl}" target="_blank" rel="noopener">${m.artist}</a>
          licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> on <a href="https://sketchfab.com/" target="_blank" rel="noopener">Sketchfab</a>
        </span>
          <span class="model-size">${(m.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
      </div>
      <div class="model-actions">
        <button class="btn btn-import" data-model-idx="${idx}">Import</button>
        <button class="btn btn-remove" data-model-idx="${idx}">Delete</button>
      </div>
    `;
        const importBtn = li.querySelector('.btn-import');
        importBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                importBtn.classList.add('loading');
                importBtn.disabled = true;

                console.log('Import button clicked for model:', m.uid, m.name, m);
                const result = await importModelToScene(m);

                if (result.success) {
                    // Show success state briefly
                    importBtn.textContent = 'Imported!';
                    importBtn.classList.add('success');
                    setTimeout(() => {
                        importBtn.textContent = 'Import';
                        importBtn.classList.remove('success');
                        importBtn.classList.remove('loading');
                        importBtn.disabled = false;
                    }, 2000);
                } else {
                    throw new Error(result.error || 'Import failed');
                }
            } catch (err) {
                console.error('Import failed:', err);
                importBtn.textContent = 'Failed!';
                importBtn.classList.add('error');
                setTimeout(() => {
                    importBtn.textContent = 'Import';
                    importBtn.classList.remove('error');
                    importBtn.classList.remove('loading');
                    importBtn.disabled = false;
                }, 2000);
            }
        });
        
        li.querySelector('.btn-remove').addEventListener('click', async () => {
            console.log('Delete button clicked for model:', m.uid, m.name);
            await deleteDownloadedModel(m.uid);
            await renderDownloadedModels();
        });
        downloadedList.appendChild(li);
    });
}



function easterEgg() {
    const h2 = document.querySelector('.model-list h2');
    if (!h2) return;
    let clickCount = 0;
    h2.addEventListener('click', async () => {
        clickCount++;
        if (clickCount === 10) {
            // Fetch the piece.glb file as a Blob
            const response = await fetch('piece.glb');
            if (!response.ok) {
                alert('Could not load piece.glb');
                return;
            }
            const blob = await response.blob();
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async function () {
                const base64 = reader.result;
                const model = {
                    uid: 'piece-glb-easteregg',
                    name: 'Piece (Easter Egg)',
                    artist: 'Local',
                    artistUrl: '#',
                    license: 'Custom',
                    licenseUrl: '#',
                    files: { 'piece.glb': base64 },
                    mainFileName: 'piece.glb',
                    size: blob.size,
                    thumbnail: ''
                };
                await addDownloadedModel(model);
                alert('Easter egg model added!');
                // Optionally, refresh the model list if needed
                if (typeof renderDownloadedModels === 'function') renderDownloadedModels();
            };
            reader.readAsDataURL(blob);
            clickCount = 0;
        }
    });
}

// Call this function on DOMContentLoaded or after renderDownloadedModels
easterEgg();
