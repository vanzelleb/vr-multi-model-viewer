// Import model into A-Frame scene
export function importModelToScene(model) {
  // If model.files exists, reconstruct all Blob URLs and patch glTF if needed
  if (model.files && model.mainFileName) {
    // Convert all base64 files to Blob URLs
    const fileUrls = {};
    for (const fname in model.files) {
      const arr = model.files[fname].split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      const blob = new Blob([u8arr], { type: mime });
      fileUrls[fname] = URL.createObjectURL(blob);
    }
    let src = fileUrls[model.mainFileName];
    // If .gltf, patch URIs to use blob URLs
    if (model.mainFileName.endsWith('.gltf')) {
      const gltfBlob = dataURLtoBlob(model.files[model.mainFileName]);
      const reader = new FileReader();
      reader.onload = function() {
        let json = JSON.parse(reader.result);
        if (json.buffers) {
          for (let i = 0; i < json.buffers.length; i++) {
            if (fileUrls[json.buffers[i].uri]) json.buffers[i].uri = fileUrls[json.buffers[i].uri];
          }
        }
        if (json.images) {
          for (let i = 0; i < json.images.length; i++) {
            if (fileUrls[json.images[i].uri]) json.images[i].uri = fileUrls[json.images[i].uri];
          }
        }
        const patchedBlob = new Blob([JSON.stringify(json)], { type: 'application/json' });
        src = URL.createObjectURL(patchedBlob);
        setAFrameModel(src);
      };
      reader.readAsText(gltfBlob);
    } else {
      setAFrameModel(src);
    }
    function setAFrameModel(srcUrl) {
      const assets = document.querySelector('a-assets');
      let asset = document.getElementById('model');
      if (!asset) {
        asset = document.createElement('a-asset-item');
        asset.id = 'model';
        assets.appendChild(asset);
      }
      asset.setAttribute('src', srcUrl);
      // Update entity
      const entity = document.querySelector('a-entity[resize]');
      if (entity) {
        entity.setAttribute('gltf-model', '#model');
      }
    }
    function dataURLtoBlob(dataurl) {
      const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    }
    return;
  }
  // fallback: legacy single file
  let src = model.glbUrl;
  if (model.glbBase64) {
    // Convert base64 to Blob
    const arr = model.glbBase64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    src = URL.createObjectURL(blob);
  }
  const assets = document.querySelector('a-assets');
  let asset = document.getElementById('model');
  if (!asset) {
    asset = document.createElement('a-asset-item');
    asset.id = 'model';
    assets.appendChild(asset);
  }
  asset.setAttribute('src', src);
  // Update entity
  const entity = document.querySelector('a-entity[resize]');
  if (entity) {
    entity.setAttribute('gltf-model', '#model');
  }
}
