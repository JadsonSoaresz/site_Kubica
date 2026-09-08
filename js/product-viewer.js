import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

function createProductViewer(container) {
  const canvas = container.querySelector("canvas");
  const modelUrl = container.dataset.model;
  if (!canvas || !modelUrl) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.6, 5.4);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(-4, -2, -4);
  scene.add(key, rim);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 8;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2.2;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    container.classList.add("interacted");
  });

  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      const mesh = gltf.scene.getObjectByProperty("type", "Mesh");
      if (!mesh) return;
      const geometry = mesh.geometry;
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      const size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      geometry.center();
      geometry.scale(2.6 / maxDim, 2.6 / maxDim, 2.6 / maxDim);

      mesh.material = new THREE.MeshStandardMaterial({
        color: 0x7c4b00,
        roughness: 0.55,
        metalness: 0.08,
      });
      mesh.rotation.x = -0.15;
      scene.add(mesh);
      container.classList.add("loaded");
    },
    undefined,
    (err) => {
      console.warn("Kubica: falha ao carregar o chaveiro 3D.", err);
      container.classList.add("load-error");
    }
  );

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let visible = true;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
    { threshold: 0.01, rootMargin: "150px 0px" }
  );
  io.observe(container);

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-product-viewer]").forEach(createProductViewer);
});
