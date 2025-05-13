// A-Frame custom components
AFRAME.registerComponent('look-at-camera', {
  tick: function () {
    const cameraEl = document.querySelector('[camera]');
    if (!cameraEl) return;
    
    const worldPos = new THREE.Vector3();
    cameraEl.object3D.getWorldPosition(worldPos);
    this.el.object3D.lookAt(worldPos);
  }
});

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
    targetSize: { type: "number", default: 2.0 }, // Target size in meters
    scaleLimit: { type: "number", default: 10.0 } // Maximum scale factor
  },

  init: function() {
    this.rescaleModel = this.rescaleModel.bind(this);
    this.el.addEventListener("model-loaded", this.rescaleModel);
  },

  remove: function() {
    this.el.removeEventListener("model-loaded", this.rescaleModel);
  },

  rescaleModel: function() {
    const el = this.el;
    const mesh = el.getObject3D("mesh");
    
    if (!mesh) {
      console.warn("Model mesh not found");
      return;
    }

    // Compute the model's bounding box
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());

    // Find the largest dimension
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim === 0) {
      console.warn("Invalid model dimensions");
      return;
    }

    // Calculate the scale factor needed to reach target size
    const scaleFactor = Math.min(
      this.data.targetSize / maxDim,
      this.data.scaleLimit
    );

    // Apply uniform scaling
    el.setAttribute("scale", `${scaleFactor} ${scaleFactor} ${scaleFactor}`);

    // Center the model
    const center = box.getCenter(new THREE.Vector3());
    const offset = center.multiplyScalar(-scaleFactor);
    
    const currentPosition = el.getAttribute("position");
    el.setAttribute("position", {
      x: currentPosition.x + offset.x,
      y: currentPosition.y + offset.y,
      z: currentPosition.z + offset.z
    });

    console.log(`Model rescaled. Original size: ${maxDim}m, Scale factor: ${scaleFactor}`);
  }
});
