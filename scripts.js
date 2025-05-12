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

function showModal() {
  document.getElementById('sketchfab-modal').style.display = 'flex';
}
function hideModal() {
  document.getElementById('sketchfab-modal').style.display = 'none';
}

function showSearch() {
  document.getElementById('sketchfab-search-container').style.display = 'flex';
}
function hideSearch() {
  document.getElementById('sketchfab-search-container').style.display = 'none';
}

// Open modal on login button click
const loginBtn = document.querySelector('.connect-button button');
if (loginBtn) {
  loginBtn.addEventListener('click', showModal);
}

// Modal close logic
const closeModalBtn = document.getElementById('close-modal');
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', hideModal);
}

// OAuth button logic
const oauthBtn = document.getElementById('sketchfab-oauth-btn');
if (oauthBtn) {
  oauthBtn.addEventListener('click', () => {
    window.location.href = OAUTH_URL;
  });
}

// Handle OAuth redirect and extract token
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace('#', '?'));
    sketchfabAccessToken = params.get('access_token');
    localStorage.setItem('sketchfabAccessToken', sketchfabAccessToken);
    hideModal();
    showSearch();
    // Optionally, remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (sketchfabAccessToken) {
    hideModal();
    showSearch();
  } else {
    hideSearch();
  }
});

// Search logic
const searchBtn = document.getElementById('sketchfab-search-btn');
const searchInput = document.getElementById('sketchfab-search');
const resultsDiv = document.getElementById('sketchfab-search-results');

async function searchSketchfab(query) {
  if (!sketchfabAccessToken) return;
  resultsDiv.innerHTML = '<div>Loading...</div>';
  const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true`, {
    headers: { Authorization: `Bearer ${sketchfabAccessToken}` }
  });
  const data = await res.json();
  resultsDiv.innerHTML = '';
  data.results.forEach(model => {
    const el = document.createElement('div');
    el.className = 'sketchfab-result';
    el.innerHTML = `
      <img src="${model.thumbnails.images[0].url}" alt="${model.name}" />
      <div class="sketchfab-result-title">${model.name}</div>
      <div class="sketchfab-result-artist">by ${model.user.displayName}</div>
      <button class="sketchfab-result-download">Download</button>
    `;
    el.querySelector('.sketchfab-result-download').onclick = () => downloadAndImportModel(model.uid);
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

// Download and import model
async function downloadAndImportModel(uid) {
  if (!sketchfabAccessToken) return;
  // Get model info
  const res = await fetch(`https://api.sketchfab.com/v3/models/${uid}/download`, {
    headers: { Authorization: `Bearer ${sketchfabAccessToken}` }
  });
  const data = await res.json();
  if (data && data.gltf && data.gltf.url) {
    // Save to localStorage (mock, as browser can't save files directly)
    localStorage.setItem('combinevr-last-model-url', data.gltf.url);
    // Update aframe scene
    const assets = document.querySelector('a-assets');
    let asset = document.getElementById('model');
    if (!asset) {
      asset = document.createElement('a-asset-item');
      asset.id = 'model';
      assets.appendChild(asset);
    }
    asset.setAttribute('src', data.gltf.url);
    // Update entity
    const entity = document.querySelector('a-entity[resize]');
    if (entity) {
      entity.setAttribute('gltf-model', '#model');
    }
    alert('Model imported!');
  } else {
    alert('Model download failed or not available.');
  }
}