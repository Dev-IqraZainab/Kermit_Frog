import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene, camera, renderer, mixer, model;
let danceAction, idleAction;
let controls;
const clock = new THREE.Clock();
let music, musicButton;
let savedPosition = new THREE.Vector3(); // To save the model's position

init();
animate();

function init() {
  scene = new THREE.Scene();

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("assets/sky.jpg", (texture) => {
    scene.background = texture;
  });

  loadEnvironment();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 30;

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 30, 7.5);
  scene.add(directionalLight);

  const loader = new GLTFLoader();
  loader.load(
    "assets/idleK.glb", // idle animation model
    (gltf) => {
      model = gltf.scene;
      model.scale.set(1, 1, 1);
      scene.add(model);

      mixer = new THREE.AnimationMixer(model);

      let idleClip = gltf.animations[0];
      // removePositionTracks(idleClip);
      idleAction = mixer.clipAction(idleClip);
      idleAction.play(); // Start with idle animation

      loadDanceAnimation();
    },
    undefined,
    (error) => {
      console.error("Error loading idle model:", error);
    }
  );

  window.addEventListener("resize", onWindowResize);

  musicButton = document.getElementById("musicButton");
  music = document.getElementById("backgroundMusic");

  musicButton.addEventListener("click", () => {
    if (music.paused) {
      music.play();
      playDance();
    } else {
      music.pause();
      holdCurrentPosition();
      playIdle();
    }
  });

  setInterval(() => {
    if (music.paused) {
      setTimeout(() => {
        music.play();
        playDance();
      }, 3000);
    }
  }, 5000);
}

function loadDanceAnimation() {
  const loader = new GLTFLoader();
  loader.load(
    "assets/kermit_frog.glb", // dance wali animation model
    (gltf) => {
      let danceClip = gltf.animations[0];
      // NO removePositionTracks on dance (usko move karne do)
      danceAction = mixer.clipAction(danceClip);
    },
    undefined,
    (error) => {
      console.error("Error loading dance animation:", error);
    }
  );
}

function holdCurrentModelPosition() {
  if (model) {
    // Trick: force model to "bake" current position
    model.updateMatrixWorld(true);

    // Get world position
    const worldPosition = new THREE.Vector3();
    model.getWorldPosition(worldPosition);

    const worldQuaternion = new THREE.Quaternion();
    model.getWorldQuaternion(worldQuaternion);

    // Now move the model itself to the current world position
    model.position.copy(worldPosition);
    model.quaternion.copy(worldQuaternion);

    // After this, when idle plays, it will stay at correct spot
  }
}

function playDance() {
  if (danceAction && idleAction) {
    // SavePosition(); // Save position before switching to dance
    idleAction.stop();
    danceAction.reset().play();
  }
}

function playIdle() {
  if (danceAction && idleAction) {
    SavePosition(); // Save position before switching to dance
    danceAction.stop();
    holdCurrentModelPosition(); // <- Important: bake position at the moment dance stops
    idleAction.reset().play();
    // restorePosition(); // Restore position after switching to idle
  }
}
function SavePosition() {
  // Save the current position of the model
  savedPosition.copy(model.position);
}

function restorePosition() {
  // Restore the saved position when idle animation starts
  if (savedPosition) {
    model.position.copy(savedPosition);
  }
}
function removePositionTracks(clip) {
  clip.tracks = clip.tracks.filter((track) => {
    return !track.name.endsWith(".position");
  });
}

function holdCurrentPosition() {
  if (model) {
    const currentPosition = model.position.clone();
    const currentRotation = model.rotation.clone();
    model.position.copy(currentPosition);
    model.rotation.copy(currentRotation);
  }
}

function loadEnvironment() {
  const loader = new GLTFLoader();
  loader.load(
    "assets/forestEnv.glb",
    (gltf) => {
      const envModel = gltf.scene;
      envModel.scale.set(0.01, 0.01, 0.01);
      envModel.position.set(0, -1.3, 0);
      scene.add(envModel);
      console.log("Environment loaded");
    },
    undefined,
    (error) => {
      console.error("Error loading environment:", error);
    }
  );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  if (controls) {
    controls.target.set(0, 1, 0);
    controls.update();
  }

  renderer.render(scene, camera);
}
