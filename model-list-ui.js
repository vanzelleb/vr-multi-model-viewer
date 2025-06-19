import { importModelToScene } from './model-import.js';
import { getDownloadedModels, deleteDownloadedModel } from './storage.js';

export async function renderDownloadedModels() {
    const downloadedList = document.getElementById('models-list');
    const aframePlaceholder = document.getElementById('aframe-placeholder');

    const models = await getDownloadedModels(); downloadedList.innerHTML = '';
    if (!models.length) {
        downloadedList.innerHTML = 'No models available yet.';
        // Remove a-scene if present
        if (aframePlaceholder) aframePlaceholder.innerHTML = '';
        return;
    }

    // Insert a-scene if not already present
    if (aframePlaceholder && !aframePlaceholder.querySelector('a-scene')) {
        aframePlaceholder.innerHTML = `
        <a-scene embedded renderer="colorManagement: true"
      embedded
      xr-mode-ui="enabled: false"
      webxr="optionalFeatures: hit-test, local-floor;"
      id="scene">
          <a-sky color="#87ceeb" hide-on-enter-ar></a-sky>
          <a-assets>
            <img id="gridTexture" src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/examples/textures/grid.png" crossorigin="anonymous" />
          </a-assets>
          <a-plane id="ground" hide-on-enter-ar src="#gridTexture" opacity="0.3" transparent="true" repeat="200 200" width="100" height="100" rotation="-90 0 0" material="side: double; transparent: true; opacity: 0.3; metalness: 0.1; roughness: 0.8;"></a-plane>
          <a-entity id="rig" position="0 0 0">
            <a-entity id="camera" position="0 1.6 3.5" camera look-controls wasd-controls></a-entity>
            <a-entity id="leftHand" hand-tracking-controls="hand: left;"></a-entity>
            <a-entity id="rightHand" hand-tracking-controls="hand: right;"></a-entity>
            <a-entity meta-touch-controls="hand: left"></a-entity>
            <a-entity meta-touch-controls="hand: right" thumbstick-logging laser-controls="hand: right" raycaster="lineColor: #fff; lineOpacity: 0.7; far: 10" grabbing scaling teleporting></a-entity>
          </a-entity>
          <a-entity resize gltf-model="#model" position="0 0.5 -1.5" rotation="0 -90 0"></a-entity>
          <a-entity id="loadingMessage" text="value: Loading model...; color: #4299e1; align: center; width: 3" position="0 2 -2" scale="1.5 1.5 1.5" look-at-camera visible="false"></a-entity>
          <a-entity id="errorMessage" text="value: Error loading model; color: #e53e3e; align: center; width: 3" position="0 2 -2" scale="1.5 1.5 1.5" look-at-camera visible="false"></a-entity>
        </a-scene>
        `;
    }

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
            // Hide search results when a model is shown
            try {
                // Show loading state
                const result = await importModelToScene(m);
                var url = location.href;               //Save down the URL without hash.
                location.href = "#aframe-placeholder";                 //Go to the target element.
                history.replaceState(null, null, url);   //Don't like hashes. Changing it back.

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
