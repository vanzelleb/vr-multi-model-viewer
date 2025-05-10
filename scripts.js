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