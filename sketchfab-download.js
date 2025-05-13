// Download and extract Sketchfab model ZIPs using zip.js
import * as zipJs from 'https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.7.61/+esm';

export async function extractModelZip(zipUrl) {
  const response = await fetch(zipUrl);
  if (!response.ok) throw new Error('Failed to download model archive');
  const blob = await response.blob();
  const reader = new zipJs.ZipReader(new zipJs.BlobReader(blob));
  const entries = await reader.getEntries();
  const fileBlobs = {};
  let sceneGltfEntry = null;
  let sceneGlbEntry = null;
  for (const entry of entries) {
    if (!entry.directory) {
      const data = await entry.getData(new zipJs.BlobWriter());
      fileBlobs[entry.filename] = data;
      if (entry.filename.endsWith('.gltf')) sceneGltfEntry = entry;
      if (entry.filename.endsWith('.glb')) sceneGlbEntry = entry;
    }
  }
  // Save all files as base64
  const fileBase64s = {};
  const fileNames = Object.keys(fileBlobs);
  for (const fname of fileNames) {
    const blob = fileBlobs[fname];
    const reader2 = new FileReader();
    await new Promise((resolve, reject) => {
      reader2.onload = function() {
        fileBase64s[fname] = reader2.result;
        resolve();
      };
      reader2.onerror = reject;
      reader2.readAsDataURL(blob);
    });
  }
  let mainFileName = null;
  if (sceneGltfEntry) mainFileName = sceneGltfEntry.filename;
  else if (sceneGlbEntry) mainFileName = sceneGlbEntry.filename;
  await reader.close();
  if (!mainFileName) throw new Error('No .gltf or .glb main file found');
  return { fileBase64s, mainFileName };
}
