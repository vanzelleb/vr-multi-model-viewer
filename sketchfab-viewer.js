// Import model into A-Frame scene
export function importModelToScene(model) {
  const assets = document.querySelector('a-assets');
  let asset = document.getElementById('model');
  if (!asset) {
    asset = document.createElement('a-asset-item');
    asset.id = 'model';
    assets.appendChild(asset);
  }
  asset.setAttribute('src', model.glbUrl);
  // Update entity
  const entity = document.querySelector('a-entity[resize]');
  if (entity) {
    entity.setAttribute('gltf-model', '#model');
  }
}
