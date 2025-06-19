// Utility functions for IndexedDB model management
const DB_NAME = 'combinevr-models';
const STORE_NAME = 'downloadedModels';
const DB_VERSION = 1;

function openDB() {
  console.log('Opening database...');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      console.log('Upgrading database...');
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log(`Creating object store: ${STORE_NAME}`);
        db.createObjectStore(STORE_NAME, { keyPath: 'uid' });
      }
    };
    request.onsuccess = () => {
      console.log('Database opened successfully');
      resolve(request.result);
    };
    request.onerror = () => {
      console.error('Error opening database:', request.error);
      reject(request.error);
    };
  });
}

export async function getDownloadedModels() {
  console.log('Fetching downloaded models...');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      console.log('Downloaded models retrieved:', request.result);
      resolve(request.result);
    };
    request.onerror = () => {
      console.error('Error fetching models:', request.error);
      reject(request.error);
    };
  });
}

export async function addDownloadedModel(model) {
  console.log('Adding downloaded model:', model);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(model.uid);
    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        console.log('Model does not exist, adding:', model);
        store.put(model);
      } else {
        console.log('Model already exists:', getRequest.result);
      }
    };
    tx.oncomplete = () => {
      console.log('Model added successfully');
      resolve();
    };
    tx.onerror = () => {
      console.error('Error adding model:', tx.error);
      reject(tx.error);
    };
  });
}

export async function deleteDownloadedModel(uid) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(uid);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}