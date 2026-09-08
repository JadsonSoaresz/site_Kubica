import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

function loadPart(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const mesh = gltf.scene.getObjectByProperty("type", "Mesh");
        if (!mesh) return reject(new Error("no mesh in " + url));
        if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
        resolve(mesh);
      },
      undefined,
      reject
    );
  });
}

function createProductViewer(container) {
  const canvas = container.querySelector("canvas");
  const modelAttr = container.dataset.model;
  if (!canvas || !modelAttr) return;

  let urls;
  try {
    const parsed = JSON.parse(modelAttr);
    urls = Array.isArray(parsed) ? parsed : [modelAttr];
  } catch (e) {
    urls = [modelAttr];
  }
  const singleColor = container.dataset.color ? "#" + container.dataset.color : null;

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
  Promise.all(urls.map((url) => loadPart(loader, url)))
    .then((meshes) => {
      const box = new THREE.Box3();
      meshes.forEach((mesh) => {
        mesh.geometry.computeBoundingBox();
        box.union(mesh.geometry.boundingBox);
      });
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.6 / maxDim;

      const group = new THREE.Group();
      meshes.forEach((mesh) => {
        mesh.geometry.translate(-center.x, -center.y, -center.z);
        mesh.geometry.scale(scale, scale, scale);
        const baseColor = singleColor ? new THREE.Color(singleColor) : mesh.material.color;
        mesh.material = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.55,
          metalness: 0.08,
        });
        group.add(mesh);
      });
      group.rotation.x = -0.15;
      scene.add(group);
      container.classList.add("loaded");
    })
    .catch((err) => {
      console.warn("Kubica: falha ao carregar modelo 3D do produto.", err);
      container.classList.add("load-error");
    });

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
