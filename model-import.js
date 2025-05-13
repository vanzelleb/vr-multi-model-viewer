// Import logic for A-Frame scene
export function importModelToScene(model, allowMultiple = false) {
  console.log('importModelToScene called', model, allowMultiple);
  
  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.warn('A-Frame scene not found!');
    return {success: false, error: 'Scene not found'};
  }
  
  const assets = scene.querySelector('a-assets');
  if (!assets) {
    console.warn('A-Frame <a-assets> not found!');
    return {success: false, error: 'Assets container not found'};
  }

  try {
    // Remove previous imported model entities if not allowMultiple
    if (!allowMultiple) {
      scene.querySelectorAll('.imported-model-entity').forEach(e => e.parentNode.removeChild(e));
      assets.querySelectorAll('.imported-model-asset').forEach(e => assets.removeChild(e));
    }

    // Add all files as <a-asset-item> if not already present
    Object.entries(model.files).forEach(([filename, dataUrl]) => {
      if (!assets.querySelector(`[data-filename="${filename}"]`)) {
        const asset = document.createElement('a-asset-item');
        const assetId = model.uid + '-' + btoa(filename).replace(/[^a-zA-Z0-9]/g, '');
        asset.setAttribute('id', assetId);
        asset.setAttribute('src', dataUrl);
        asset.setAttribute('data-filename', filename);
        asset.classList.add('imported-model-asset');
        assets.appendChild(asset);
        
        // Add loading event listener
        asset.addEventListener('error', (err) => {
          console.error('Failed to load asset:', filename, err);
          throw new Error(`Failed to load asset: ${filename}`);
        });
      }
    });

    // Find the asset id for the main file
    const mainAssetId = model.uid + '-' + btoa(model.mainFileName).replace(/[^a-zA-Z0-9]/g, '');
      // Show loading message
    const loadingMessage = scene.querySelector('#loadingMessage');
    const errorMessage = scene.querySelector('#errorMessage');
    if (loadingMessage) loadingMessage.setAttribute('visible', true);
    if (errorMessage) errorMessage.setAttribute('visible', false);

    // Add the model entity to the scene
    const entity = document.createElement('a-entity');
    entity.setAttribute('gltf-model', `#${mainAssetId}`);
    entity.setAttribute('class', 'imported-model-entity');
    entity.setAttribute('position', '0 0.5 -1.5');
    entity.setAttribute('rotation', '0 -90 0');
    entity.setAttribute('resize', {targetSize: 2.0, scaleLimit: 10.0});
    
    // Add model-error event listener
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
    
    // Return a promise that resolves when the model is loaded or rejects on error
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Model import timed out'));
      }, 30000); // 30 second timeout
        entity.addEventListener('model-loaded', () => {
        clearTimeout(timeout);
        console.log('Model loaded successfully:', model.name);
        if (loadingMessage) loadingMessage.setAttribute('visible', false);
        if (errorMessage) errorMessage.setAttribute('visible', false);
        resolve({success: true, entity});
      });
      
      assets.addEventListener('loaded', () => {
        entity.setAttribute('gltf-model', `#${mainAssetId}`);
      });
    });

  } catch (err) {
    console.error('Error importing model:', err);
    return {success: false, error: err.message};
  }
}
