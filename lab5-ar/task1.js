import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let sphereMesh, planeMesh, cylinderMesh;
let controls;
let particles;
let hue = 0;

let rotationEnabled = true;
let pulseMoveEnabled = true;
let colorEmitEnabled = true;
let speedMode = "normal";
let texturesEnabled = true;
let rotationDirection = 1;
let specialEffectActive = false;
let specialEffectTimer = 0;

// Матеріали з текстурами та без текстур
let sphereMaterial, sphereMaterialNoTexture;
let cylinderMaterial, cylinderMaterialNoTexture;
let planeMaterial, planeMaterialNoTexture;

init();
animate();

function init() {

  const container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
  directionalLight.position.set(3, 3, 3);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 10, 10);
  pointLight.position.set(-2, 2, 2);
  scene.add(pointLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const textureLoader = new THREE.TextureLoader();
  const glassTexture = textureLoader.load("https://as1.ftcdn.net/v2/jpg/01/61/23/82/1000_F_161238202_GbkRIC1lSjG7lZCLLPfQ7wAaEQyw9UsG.jpg");
  const metalTexture = textureLoader.load("https://images.unsplash.com/photo-1501166222995-ff31c7e93cef?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWV0YWwlMjB0ZXh0dXJlc3xlbnwwfHwwfHx8MA%3D%3D");
  const lavaTexture = textureLoader.load("https://t4.ftcdn.net/jpg/01/83/14/47/360_F_183144766_dbGaN37u6a4VCliXQ6wcarerpYmuLAto.jpg");

  // 1. Сфера
  const sphereGeometry = new THREE.SphereGeometry(0.5, 31, 32);
    sphereMaterial = new THREE.MeshPhysicalMaterial({
    map: glassTexture,
    transparent: true,
    opacity: 0.7,
    roughness: 0.5,
    metalness: 0.3,
    transmission: 0.6,
  });

    sphereMaterialNoTexture = new THREE.MeshPhysicalMaterial({
    color: 0x0066ff,
    metalness: 0.3,
    roughness: 0.1,
    clearcoat: 0.9,
    transmission: 0.9,
    thickness: 0.4,
    transparent: true,
  });

  sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphereMesh.position.set(-1.5, 0, -5);
  scene.add(sphereMesh);

  // 2. Циліндр
  const cylinderGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1, 9);
    cylinderMaterial = new THREE.MeshStandardMaterial({
    map: metalTexture,
    metalness: 0.8,
    roughness: 0.2,
  });
    cylinderMaterialNoTexture = new THREE.MeshToonMaterial({ color: 0xff6699 });
  cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinderMesh.position.set(0, 0, -5);
  scene.add(cylinderMesh);

  // 3. Площина
  const planeGeometry = new THREE.PlaneGeometry(0.6, 0.6, 10, 10);
    planeMaterial = new THREE.MeshStandardMaterial({
    map: lavaTexture,
    emissive: 0xff0000,
    emissiveIntensity: 1.5,
    metalness: 0.5,
    roughness: 0.4,
  });
    planeMaterialNoTexture = new THREE.MeshPhongMaterial({
    color: 0xffff00,
    shininess: 100,
    specular: 0xffcc00,
    wireframe: true,
  });
  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.position.set(1.5, 0, -5);
  scene.add(planeMesh);

  createParticles();

  camera.position.z = 3;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const button = ARButton.createButton(renderer, {
    onSessionStarted: () => {
      renderer.domElement.style.background = "transparent";
      document.getElementById("controls").style.display = "flex";
    },
    onSessionEnded: () => {
      document.getElementById("controls").style.display = "flex";
    },
  });
  document.body.appendChild(button);
  renderer.domElement.style.display = "block";

  document.getElementById("toggleRotationBtn").addEventListener("click", toggleRotation);
  document.getElementById("togglePulseBtn").addEventListener("click", togglePulseMove);
  document.getElementById("toggleColorBtn").addEventListener("click", toggleColorEmit);
  document.getElementById("toggleSpeedBtn").addEventListener("click", toggleSpeed);
  document.getElementById("toggleTexturesBtn").addEventListener("click", toggleTextures);
  document.getElementById("toggleDirectionBtn").addEventListener("click", toggleDirection);
  document.getElementById("specialEffectBtn").addEventListener("click", triggerSpecialEffect);
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "../index.html";
  });
  window.addEventListener("resize", onWindowResize, false);
}

function createParticles() {
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 8;

    colors[i * 3] = Math.random();
    colors[i * 3 + 1] = Math.random();
    colors[i * 3 + 2] = Math.random();
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0,
  });

  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}

function toggleRotation() {
  rotationEnabled = !rotationEnabled;
  document.getElementById("toggleRotationBtn").textContent = rotationEnabled ? "Disable Rotation" : "Enable Rotation";
}

function togglePulseMove() {
  pulseMoveEnabled = !pulseMoveEnabled;
  document.getElementById("togglePulseBtn").textContent = pulseMoveEnabled ? "Disable Pulse/Move" : "Enable Pulse/Move";
}

function toggleColorEmit() {
  colorEmitEnabled = !colorEmitEnabled;
  document.getElementById("toggleColorBtn").textContent = colorEmitEnabled ? "Disable Color/Emit" : "Enable Color/Emit";
}

function toggleSpeed() {
  speedMode = speedMode === "normal" ? "fast" : "normal";
  document.getElementById("toggleSpeedBtn").textContent = `Speed: ${speedMode.charAt(0).toUpperCase() + speedMode.slice(1)}`;
}

function toggleTextures() {
  texturesEnabled = !texturesEnabled;
  document.getElementById("toggleTexturesBtn").textContent = texturesEnabled
    ? "Disable Textures"
    : "Enable Textures";

  sphereMesh.material = texturesEnabled ? sphereMaterial : sphereMaterialNoTexture;
  cylinderMesh.material = texturesEnabled ? cylinderMaterial : cylinderMaterialNoTexture;
  planeMesh.material = texturesEnabled ? planeMaterial : planeMaterialNoTexture;

  sphereMesh.material.needsUpdate = true;
  cylinderMesh.material.needsUpdate = true;
  planeMesh.material.needsUpdate = true;
}

function toggleDirection() {
  rotationDirection *= -1;
  document.getElementById("toggleDirectionBtn").textContent = rotationDirection === 1 ? "Direction: Forward" : "Direction: Backward";
}

function triggerSpecialEffect() {
  specialEffectActive = true;
  specialEffectTimer = 0;
  particles.material.opacity = 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
  controls.update();
}

function render(timestamp) {
  animateObjects(timestamp);
  renderer.render(scene, camera);
}

function animateObjects(timestamp) {
  const speed = speedMode === "normal" ? 1 : 2;
  const specialSpeed = specialEffectActive ? 3 : 1;

  if (rotationEnabled) {
    sphereMesh.rotation.y -= 0.01 * speed * rotationDirection * specialSpeed;
    cylinderMesh.rotation.x -= 0.04 * speed * rotationDirection * specialSpeed;
    cylinderMesh.rotation.y -= 0.04 * speed * rotationDirection * specialSpeed;
    cylinderMesh.rotation.z -= 0.04 * speed * rotationDirection * specialSpeed;
    planeMesh.rotation.z -= 0.15 * speed * rotationDirection * specialSpeed;
  }

  if (pulseMoveEnabled) {
    const pulse = Math.sin(timestamp * 0.002 * speed * specialSpeed);
    sphereMesh.scale.set(1 + 0.2 * pulse, 1 + 0.2 * pulse, 1 + 0.2 * pulse);
    sphereMesh.position.y = 0.1 * pulse;
    cylinderMesh.scale.set(1 + 0.2 * pulse, 1 + 0.2 * pulse, 1 + 0.2 * pulse);
    cylinderMesh.position.y = 0.5 * pulse;
    planeMesh.scale.set(1 + 0.2 * pulse, 1 + 0.2 * pulse, 1 + 0.2 * pulse);
    planeMesh.position.y = 0.5 * pulse;
  }

  if (colorEmitEnabled) {
    hue += 0.005 * speed * specialSpeed;
    if (hue > 1) hue = 0;
    cylinderMesh.material.color.setHSL(hue, 1, 0.5);
  }

  if (specialEffectActive) {
    specialEffectTimer += 0.1 * speed * specialSpeed;
    particles.material.opacity = Math.max(0, 1 - specialEffectTimer / 5);
    if (specialEffectTimer >= 5) {
      specialEffectActive = false;
      particles.material.opacity = 0;
    }
  }
}
