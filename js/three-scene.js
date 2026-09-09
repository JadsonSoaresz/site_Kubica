import * as THREE from "three";
import { STLLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/STLLoader.js";

const canvas = document.getElementById("heroCanvas");
const hero = document.getElementById("hero");
if (!canvas || !hero) {
  // nothing to do
} else {
  initScene(canvas, hero);
}

function initScene(canvas, hero) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    canvas.style.display = "none";
    return;
  }
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, hero.clientWidth / hero.clientHeight, 0.1, 100);

  function isMobile() {
    return window.innerWidth < 760;
  }
  camera.position.set(0, 0, isMobile() ? 16.5 : 11);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(hero.clientWidth, hero.clientHeight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(5, 6, 8);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  rim.position.set(-6, -3, -6);
  scene.add(ambient, key, rim);

  // ---- Kubica "K" logo, loaded from STL ----
  const group = new THREE.Group();
  group.rotation.set(-0.1, 0.3, 0);
  group.scale.setScalar(isMobile() ? 0.8 : 1);
  if (isMobile()) {
    group.position.set(0.4, -1.6, 0);
  }
  scene.add(group);

  const logoPivot = new THREE.Group();
  group.add(logoPivot);

  let buildComplete = false;
  let buildPlane = null;

  const loader = new STLLoader();
  loader.load(
    "assets/kubica-k.stl",
    (geometry) => {
      geometry.computeBoundingBox();
      const size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scaleFactor = 5.2 / maxDim;
      const THICKNESS = 0.45; // slims down the depth (Z) so the logo reads thinner edge-on

      geometry.center();
      geometry.scale(scaleFactor, scaleFactor, scaleFactor * THICKNESS);
      geometry.computeVertexNormals();

      const solidMat = new THREE.MeshStandardMaterial({
        color: 0x0c0c0c,
        roughness: 0.5,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xf4f4f2,
        transparent: true,
        opacity: isMobile() ? 0.45 : 0.8,
      });

      const mesh = new THREE.Mesh(geometry, solidMat);
      const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 15), lineMat);
      mesh.add(wireframe);
      logoPivot.add(mesh);

      // ---- build-in animation: reveal bottom-to-top, like a print job ----
      group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(group);
      buildPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), box.min.y);
      solidMat.clippingPlanes = [buildPlane];
      lineMat.clippingPlanes = [buildPlane];

      const gsap = window.gsap;
      if (gsap) {
        gsap.to(buildPlane, {
          constant: box.max.y,
          duration: 1.4,
          delay: 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            solidMat.clippingPlanes = [];
            lineMat.clippingPlanes = [];
            buildComplete = true;
          },
        });
      } else {
        buildPlane.constant = box.max.y;
        solidMat.clippingPlanes = [];
        lineMat.clippingPlanes = [];
        buildComplete = true;
      }
    },
    undefined,
    (err) => {
      console.warn("Kubica: falha ao carregar o logo STL, usando placeholder.", err);
      const fallbackGeo = new THREE.BoxGeometry(4, 4, 4);
      const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.55 });
      const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
      const fallbackEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(fallbackGeo),
        new THREE.LineBasicMaterial({ color: 0xf4f4f2, transparent: true, opacity: 0.6 })
      );
      fallbackMesh.add(fallbackEdges);
      logoPivot.add(fallbackMesh);
      buildComplete = true;
    }
  );

  // particles
  const particleCount = 140;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
  }
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.35 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---- pointer parallax ----
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // ---- scroll-driven rotation / fade ----
  let scrollProgress = 0;
  function updateScrollProgress() {
    const rect = hero.getBoundingClientRect();
    const total = rect.height;
    const passed = Math.min(Math.max(-rect.top, 0), total);
    scrollProgress = total > 0 ? passed / total : 0;
  }
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  // ---- resize ----
  function onResize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    camera.aspect = w / h;
    baseCameraZ = isMobile() ? 16.5 : 11;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    group.position.x = isMobile() ? 0.4 : 0;
    baseGroupY = isMobile() ? -1.6 : 0;
  }
  let baseGroupY = isMobile() ? -1.6 : 0;
  let baseCameraZ = isMobile() ? 16.5 : 11;
  window.addEventListener("resize", onResize);

  const clock = new THREE.Clock();
  let targetRotX = group.rotation.x;
  let targetRotY = group.rotation.y;

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (buildComplete) {
      const autoRotate = clock.elapsedTime * 0.18;
      targetRotY = 0.3 + autoRotate + scrollProgress * 2.4 + pointer.x * 0.2;
      targetRotX = -0.1 + pointer.y * -0.12 + scrollProgress * 0.6;

      group.rotation.y += (targetRotY - group.rotation.y) * Math.min(dt * 3, 1);
      group.rotation.x += (targetRotX - group.rotation.x) * Math.min(dt * 3, 1);
    }

    group.position.y = baseGroupY;
    group.scale.setScalar(isMobile() ? 0.8 : 1);

    // dolly the camera through the middle of the logo as the hero scrolls away
    const dollyRange = isMobile() ? 20 : 16;
    const dollyEase = scrollProgress * scrollProgress;
    const targetZ = baseCameraZ - dollyEase * dollyRange;
    camera.position.z += (targetZ - camera.position.z) * Math.min(dt * 4, 1);

    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    const fadeStart = 0.55;
    const fadeEnd = 0.95;
    const fade = 1 - Math.min(Math.max((scrollProgress - fadeStart) / (fadeEnd - fadeStart), 0), 1);
    canvas.style.opacity = fade;

    particles.rotation.y += dt * 0.015;

    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);
  }
  animate();
}
