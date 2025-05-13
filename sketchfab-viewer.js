// Import model into A-Frame scene
export function importModelToScene(model) {
  // If model.glbBase64 exists, convert it to a Blob URL
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
