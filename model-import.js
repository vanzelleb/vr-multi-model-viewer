// Import logic for A-Frame scene
export function importModelToScene(model, allowMultiple = false) {
  console.log('importModelToScene called', model, allowMultiple);
  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.warn('A-Frame scene not found!');
    return { success: false, error: 'Scene not found' };
  }

  // 1. Create blob URLs for all files
  const blobUrls = {};
  Object.entries(model.files).forEach(([filename, dataUrl]) => {
    // Convert dataURL to Blob
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    blobUrls[filename] = URL.createObjectURL(blob);
  });

  // 2. Patch .gltf file to use blob URLs
  let gltfBlobUrl = null;
  const mainFileName = model.mainFileName;
  if (mainFileName.endsWith('.gltf')) {
    const gltfText = atob(model.files[mainFileName].split(',')[1]);
    const gltfJson = JSON.parse(gltfText);
    if (gltfJson.buffers) {
      gltfJson.buffers.forEach(buf => {
        if (buf.uri && blobUrls[buf.uri]) {
          buf.uri = blobUrls[buf.uri];
        }
      });
    }
    if (gltfJson.images) {
      gltfJson.images.forEach(img => {
        if (img.uri && blobUrls[img.uri]) {
          img.uri = blobUrls[img.uri];
        }
      });
    }
    const patchedText = JSON.stringify(gltfJson);
    const patchedBlob = new Blob([patchedText], { type: 'model/gltf+json' });
    gltfBlobUrl = URL.createObjectURL(patchedBlob);
  }

  // 3. Show loading message
  const loadingMessage = scene.querySelector('#loadingMessage');
  const errorMessage = scene.querySelector('#errorMessage');
  if (loadingMessage) loadingMessage.setAttribute('visible', true);
  if (errorMessage) errorMessage.setAttribute('visible', false);

  // 4. Add the model entity to the scene
  const entity = document.createElement('a-entity');
  entity.setAttribute('class', 'imported-model-entity');
  // Ensure model is above the ground plane
  entity.setAttribute('position', '0 0.5 -5');
  entity.setAttribute('resize', { targetSize: 2.0, scaleLimit: 10.0 });
  entity.setAttribute('reposition-on-load', '');
  if (mainFileName.endsWith('.gltf')) {
    entity.setAttribute('gltf-model', gltfBlobUrl);
  } else if (mainFileName.endsWith('.glb')) {
    entity.setAttribute('gltf-model', blobUrls[mainFileName]);
  }

  entity.addEventListener('model-error', (err) => {
    console.error('Model failed to load:', err);
    if (loadingMessage) loadingMessage.setAttribute('visible', false);
    if (errorMessage) {
      errorMessage.setAttribute('text', 'value', `Error: ${err.detail.message || 'Failed to load model'}`);
      errorMessage.setAttribute('visible', true);
    }
    throw new Error('Failed to load 3D model');
  });

  scene.appendChild(entity);

  // 5. Return a promise that resolves when the model is loaded or rejects on error
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Model import timed out'));
    }, 30000);
    entity.addEventListener('model-loaded', () => {
      clearTimeout(timeout);
      console.log('Model loaded successfully:', model.name);
      if (loadingMessage) loadingMessage.setAttribute('visible', false);
      if (errorMessage) errorMessage.setAttribute('visible', false);
      resolve({ success: true, entity });
    });
  });
}
