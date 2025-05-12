AFRAME.registerComponent("thumbstick-logging", {
  init: function () {
    this.el.addEventListener("thumbstickmoved", this.logThumbstick);
  },
  logThumbstick: function (evt) {
    if (evt.detail.y > 0.95) {
      document.querySelector("#rig").object3D.position.z += 0.05;
    }
    if (evt.detail.y < -0.95) {
      document.querySelector("#rig").object3D.position.z -= 0.05;
    }
    if (evt.detail.x < -0.95) {
      document.querySelector("#rig").object3D.position.x -= 0.05;
    }
    if (evt.detail.x > 0.95) {
      document.querySelector("#rig").object3D.position.x += 0.05;
    }
  },
});

AFRAME.registerComponent("grabbing", {
  init: function () {
    this.grabbed = null;
  },
  events: {
    gripdown: function (evt) {
      if (
        evt.currentTarget.components["raycaster"].intersections.length > 0
      ) {
        this.grabbed =
          evt.currentTarget.components[
            "raycaster"
          ].intersections[0].object.el;
        evt.currentTarget.object3D.attach(this.grabbed.object3D);
      }
    },
    gripup: function (evt) {
      if (this.grabbed) {
        this.el.sceneEl.object3D.attach(this.grabbed.object3D);
        this.grabbed = null;
      }
    },
  },
});

AFRAME.registerComponent("teleporting", {
  init: function () {
    this.destination = null;
  },
  events: {
    triggerdown: function (evt) {
      if (
        evt.currentTarget.components["raycaster"].intersections.length > 0
      ) {
        this.destination =
          evt.currentTarget.components[
            "raycaster"
          ].intersections[0].point;
        document.querySelector("#rig").object3D.position.x =
          this.destination.x;
        document.querySelector("#rig").object3D.position.z =
          this.destination.z;
        document.querySelector("#pieceEntity").object3D.position.x =
          this.destination.x;
        document.querySelector("#pieceEntity").object3D.position.z =
          this.destination.z;
      }
    },
  },
});

AFRAME.registerComponent("scaling", {
  init: function () {
    this.scale = null;
  },
  events: {
    bbuttondown: function (evt) {
      if (
        evt.currentTarget.components["raycaster"].intersections.length > 0
      ) {
        this.scale =
          evt.currentTarget.components[
            "raycaster"
          ].intersections[0].object.el;
        this.scale.object3D.scale.multiplyScalar(1.1);
      }
    },
    abuttondown: function (evt) {
      if (
        evt.currentTarget.components["raycaster"].intersections.length > 0
      ) {
        this.scale =
          evt.currentTarget.components[
            "raycaster"
          ].intersections[0].object.el;
        this.scale.object3D.scale.multiplyScalar(0.9);
      }
    },
  },
});

AFRAME.registerComponent("resize", {
  schema: {
    axis: {
      type: "string",
      default: "x",
    },
    value: {
      type: "number",
      default: 1,
    },
  },
  init: function () {
    var el = this.el;
    var data = this.data;
    var model = el.object3D;
    el.addEventListener("model-loaded", function (e) {
      var model = el.getObject3D("mesh");
      if (model) {
        var box = new THREE.Box3().setFromObject(model);
        var size = box.getSize(new THREE.Vector3()); // Pass a new Vector3 to avoid undefined errors
        console.log("Model size:", size);
      } else {
        console.warn("Model is undefined!");
      }
      var x = size.x;
      var y = size.y;
      var z = size.z;
      if (data.axis === "x") {
        var scale = data.value / x;
      } else if (data.axis === "y") {
        var scale = data.value / y;
      } else {
        var scale = data.value / z;
      }
      el.setAttribute("scale", scale + " " + scale + " " + scale);
    });
  },
});

// --- Sketchfab OAuth and Model Search Logic ---
const SKETCHFAB_CLIENT_ID = 'l1SrgifJvXQ3BehACPbq9ykx8Ke02NTYuyjXoLJv';
const SKETCHFAB_REDIRECT_URI = 'https://combinevr.netlify.app/';
const OAUTH_URL = `https://sketchfab.com/oauth2/authorize/?response_type=token&client_id=${SKETCHFAB_CLIENT_ID}&redirect_uri=${encodeURIComponent(SKETCHFAB_REDIRECT_URI)}`;

let sketchfabAccessToken = localStorage.getItem('sketchfabAccessToken') || null;

const loginBtn = document.getElementById('sketchfab-login-btn');
const loginContainer = document.getElementById('sketchfab-login-container');
const searchContainer = document.getElementById('sketchfab-search-container');
const searchBtn = document.getElementById('sketchfab-search-btn');
const searchInput = document.getElementById('sketchfab-search');
const resultsDiv = document.getElementById('sketchfab-search-results');
const downloadedList = document.getElementById('downloaded-models-list');

function showLogin() {
  loginContainer.style.display = 'block';
  searchContainer.style.display = 'none';
}
function showSearch() {
  loginContainer.style.display = 'none';
  searchContainer.style.display = 'flex';
}

if (loginBtn) {
  loginBtn.onclick = () => {
    window.location.href = OAUTH_URL;
  };
}

// Handle OAuth redirect and extract token
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace('#', '?'));
    sketchfabAccessToken = params.get('access_token');
    localStorage.setItem('sketchfabAccessToken', sketchfabAccessToken);
    showSearch();
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (sketchfabAccessToken) {
    showSearch();
  } else {
    showLogin();
  }
  renderDownloadedModels();
});

// --- Search logic ---
async function searchSketchfab(query) {
  if (!sketchfabAccessToken) return;
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true`, {
    headers: { Authorization: `Bearer ${sketchfabAccessToken}` }
  });
  const data = await res.json();
  resultsDiv.innerHTML = '';
  data.results.forEach(model => {
    // Find smallest .glb file in model's available formats
    let smallestGlb = null;
    let minSize = Infinity;
    if (model.archives && model.archives.gltf) {
      model.archives.gltf.forEach(file => {
        if (file.format === 'gltf' && file.size < minSize && file.url.endsWith('.glb')) {
          smallestGlb = file;
          minSize = file.size;
        }
      });
    }
    // fallback: show download button if downloadable
    const sizeMB = smallestGlb ? (smallestGlb.size / (1024 * 1024)).toFixed(2) : null;
    const el = document.createElement('div');
    el.className = 'sketchfab-result';
    el.innerHTML = `
      <img src="${model.thumbnails.images[0].url}" alt="${model.name}" />
      <div class="sketchfab-result-title">${model.name}</div>
      <div class="sketchfab-result-artist">by ${model.user.displayName}</div>
      ${sizeMB ? `<div class="sketchfab-result-size">${sizeMB} MB</div>` : ''}
      <button class="sketchfab-result-download" ${smallestGlb ? '' : 'disabled'}>Download</button>
    `;
    el.querySelector('.sketchfab-result-download').onclick = () => {
      if (smallestGlb) downloadAndSaveModel(model, smallestGlb);
    };
    resultsDiv.appendChild(el);
  });
}

if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    if (searchInput.value.trim()) {
      searchSketchfab(searchInput.value.trim());
    }
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      searchSketchfab(searchInput.value.trim());
    }
  });
}

// --- Download, Save, and Import Logic ---
function getDownloadedModels() {
  return JSON.parse(localStorage.getItem('combinevr-downloaded-models') || '[]');
}
function saveDownloadedModels(models) {
  localStorage.setItem('combinevr-downloaded-models', JSON.stringify(models));
}

async function downloadAndSaveModel(model, glbFile) {
  // Save model info and glb url to localStorage
  const downloaded = getDownloadedModels();
  if (!downloaded.find(m => m.uid === model.uid)) {
    downloaded.push({
      uid: model.uid,
      name: model.name,
      artist: model.user.displayName,
      artistUrl: model.user.profileUrl || '#',
      license: model.license || 'CC BY 4.0',
      licenseUrl: model.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
      glbUrl: glbFile.url,
      size: glbFile.size
    });
    saveDownloadedModels(downloaded);
    renderDownloadedModels();
  }
}

function renderDownloadedModels() {
  const models = getDownloadedModels();
  downloadedList.innerHTML = '';
  if (!models.length) {
    downloadedList.innerHTML = '<li style="color:var(--text-muted);padding:1rem;">No models downloaded yet.</li>';
    return;
  }
  models.forEach((m, idx) => {
    const li = document.createElement('li');
    li.className = 'model-item';
    li.innerHTML = `
      <h3 class="model-name">${m.name}</h3>
      <div class="model-credits">
        <a href="${m.artistUrl}" class="artist" target="_blank">by ${m.artist}</a>
        <a href="${m.licenseUrl}" class="license" target="_blank">${m.license}</a>
        <span class="model-size">${(m.size / (1024 * 1024)).toFixed(2)} MB</span>
      </div>
      <div class="model-actions">
        <button class="btn btn-import">Import</button>
        <button class="btn btn-remove">Delete</button>
      </div>
    `;
    li.querySelector('.btn-import').onclick = () => importModelToScene(m);
    li.querySelector('.btn-remove').onclick = () => {
      const updated = getDownloadedModels().filter(mm => mm.uid !== m.uid);
      saveDownloadedModels(updated);
      renderDownloadedModels();
    };
    downloadedList.appendChild(li);
  });
}

function importModelToScene(model) {
  // Update aframe scene
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