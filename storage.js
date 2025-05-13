// Utility functions for localStorage model management
export function getDownloadedModels() {
  return JSON.parse(localStorage.getItem('combinevr-downloaded-models') || '[]');
}
export function saveDownloadedModels(models) {
  localStorage.setItem('combinevr-downloaded-models', JSON.stringify(models));
}
export function addDownloadedModel(model) {
  const downloaded = getDownloadedModels();
  if (!downloaded.find(m => m.uid === model.uid)) {
    downloaded.push(model);
    saveDownloadedModels(downloaded);
  }
}
