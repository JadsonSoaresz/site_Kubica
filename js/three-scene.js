import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

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

  // ---- voxel cube: 4x4x4 grid, "printed" layer by layer ----
  const GRID = 4;
  const GAP = 0.06;
  const SIZE = 1;
  const cell = SIZE + GAP;
  const offset = ((GRID - 1) * cell) / 2;

  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
  const edgesGeo = new THREE.EdgesGeometry(boxGeo);

  const voxels = [];

  for (let x = 0; x < GRID; x++) {
    for (let y = 0; y < GRID; y++) {
      for (let z = 0; z < GRID; z++) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0c0c0c,
          roughness: 0.55,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(boxGeo, mat);
        const edges = new THREE.LineSegments(
          edgesGeo,
          new THREE.LineBasicMaterial({ color: 0xf4f4f2, transparent: true, opacity: isMobile() ? 0.32 : 0.55 })
        );
        mesh.add(edges);

        mesh.position.set(x * cell - offset, y * cell - offset, z * cell - offset);
        mesh.scale.setScalar(0);
        group.add(mesh);
        voxels.push({ mesh, layer: y });
      }
    }
  }

  group.rotation.set(-0.35, 0.65, 0);
  if (isMobile()) {
    group.position.set(0.4, -1.6, 0);
  }
  scene.add(group);

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

  // ---- build-in animation (print layer by layer) ----
  const gsapReady = () => window.gsap;

  function playBuildAnimation() {
    if (!gsapReady()) {
      voxels.forEach((v) => v.mesh.scale.setScalar(1));
      return;
    }
    const tl = window.gsap.timeline({ delay: 0.3 });
    for (let layer = 0; layer < GRID; layer++) {
      const layerVoxels = voxels.filter((v) => v.layer === layer).map((v) => v.mesh.scale);
      tl.to(
        layerVoxels,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.03,
        },
        layer * 0.22
      );
    }
  }
  playBuildAnimation();

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
    camera.position.z = isMobile() ? 16.5 : 11;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    group.position.x = isMobile() ? 0.4 : 0;
    baseGroupY = isMobile() ? -1.6 : 0;
  }
  let baseGroupY = isMobile() ? -1.6 : 0;
  window.addEventListener("resize", onResize);

  const clock = new THREE.Clock();
  let targetRotX = group.rotation.x;
  let targetRotY = group.rotation.y;

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    const autoRotate = clock.elapsedTime * 0.12;
    targetRotY = 0.65 + autoRotate + scrollProgress * 2.4 + pointer.x * 0.25;
    targetRotX = -0.35 + pointer.y * -0.15 + scrollProgress * 0.6;

    group.rotation.y += (targetRotY - group.rotation.y) * Math.min(dt * 3, 1);
    group.rotation.x += (targetRotX - group.rotation.x) * Math.min(dt * 3, 1);

    group.position.y = baseGroupY - scrollProgress * 1.4;
    const scale = (isMobile() ? 0.8 : 1) * (1 - scrollProgress * 0.25);
    group.scale.setScalar(scale);

    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    particles.rotation.y += dt * 0.015;

    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);
  }
  animate();
}
