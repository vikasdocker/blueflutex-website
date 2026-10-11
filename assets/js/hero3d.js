/* =========================================================
   BlueFluteX — immersive resonance hero

   One lightweight Three.js scene: the existing contour field plus a
   layered "resonator" sculpture. The canvas is decorative; the page
   content remains readable and complete without WebGL.

   Performance safeguards:
   - capped device-pixel ratio and reduced mesh / particle counts on mobile
   - frame loop pauses offscreen and while the tab is hidden
   - adaptive pixel ratio if rendering is slow
   - reduced-motion users receive a single still frame
   - data-saver / very-low-memory phones use the CSS fallback
   ========================================================= */
import * as THREE from "three";
import { VERT, FRAG } from "./shaders.js";

const canvas = document.getElementById("resonance");
const hero = document.querySelector(".hero");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const narrow = matchMedia("(max-width: 780px)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const saveData = Boolean(navigator.connection?.saveData);
const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;

function bail() {
  hero?.classList.add("is-fallback");
  hero?.classList.remove("is-immersive");
  canvas?.remove();
}

if (!canvas || !hero) {
  // The content is independent of the decorative scene.
} else if (!window.WebGLRenderingContext || (narrow && (saveData || lowMemory))) {
  bail();
} else {
  try {
    boot();
  } catch {
    bail();
  }
}

function boot() {
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => (css.getPropertyValue(name) || fallback).trim();
  const ink = new THREE.Color(token("--ink", "#14110f"));
  const accent = new THREE.Color(token("--teal", "#0f5c56"));
  const dprCap = narrow ? 1.25 : 1.75;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !narrow,
      alpha: true,
      powerPreference: narrow ? "low-power" : "high-performance",
    });
  } catch {
    bail();
    return;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 70);
  camera.position.set(0, 0, 5.2);

  /* ---------- contour field backdrop ---------- */
  const plane = new THREE.PlaneGeometry(1, 1, narrow ? 86 : 156, narrow ? 60 : 108);
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: narrow ? 0.42 : 0.52 },
    uRipple: { value: new THREE.Vector2(0, 0) },
    uInk: { value: ink },
    uAccent: { value: accent },
    uRes: { value: new THREE.Vector2(1, 1) },
    uBands: { value: narrow ? 25.0 : 32.0 },
  };
  const fieldMaterial = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const field = new THREE.Mesh(plane, fieldMaterial);
  field.position.z = -0.8;
  field.rotation.x = -0.28;
  scene.add(field);

  /* ---------- layered resonance sculpture ----------
     Fine wire rings, a faceted core and a sparse orbit of nodes. No textures,
     external assets, post-processing or extra scene dependencies are needed. */
  const sculpture = new THREE.Group();
  sculpture.scale.setScalar(narrow ? 0.5 : 1);
  scene.add(sculpture);

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 48),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
    })
  );
  halo.position.z = -0.18;
  sculpture.add(halo);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.48, 2),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.38,
      wireframe: true,
      depthWrite: false,
    })
  );
  sculpture.add(core);

  const innerCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.31, 1),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
    })
  );
  sculpture.add(innerCore);

  const orbitMaterials = [
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.48, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: ink, transparent: true, opacity: 0.18, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.27, depthWrite: false }),
  ];
  const orbitSpecs = [
    { radius: 1.28, tube: 0.009, rot: [1.05, 0.16, 0.28] },
    { radius: 1.02, tube: 0.008, rot: [0.66, 0.94, -0.58] },
    { radius: 1.48, tube: 0.006, rot: [0.38, -0.28, 1.06] },
  ];
  const orbits = orbitSpecs.map((spec, index) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 5, narrow ? 84 : 144),
      orbitMaterials[index]
    );
    mesh.rotation.set(...spec.rot);
    sculpture.add(mesh);
    return mesh;
  });

  // Fibonacci-distributed points provide depth without allocating per-frame objects.
  const pointCount = narrow ? 34 : 92;
  const positions = new Float32Array(pointCount * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < pointCount; i += 1) {
    const y = 1 - (i / Math.max(1, pointCount - 1)) * 2;
    const radius = 1.28 + ((i % 5) * 0.055);
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    positions[i * 3] = Math.cos(theta) * ring * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * ring * radius;
  }
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pointMaterial = new THREE.PointsMaterial({
    color: accent,
    size: narrow ? 0.022 : 0.028,
    transparent: true,
    opacity: 0.58,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const points = new THREE.Points(pointGeometry, pointMaterial);
  sculpture.add(points);

  /* ---------- responsive camera framing ---------- */
  function layout() {
    const width = canvas.clientWidth || hero.clientWidth;
    const height = canvas.clientHeight || hero.clientHeight;
    if (!width || !height) return;

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const bufferSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    uniforms.uRes.value.set(bufferSize.x, bufferSize.y);

    const fovRadians = (camera.fov * Math.PI) / 180;
    const planeDepth = camera.position.z - field.position.z;
    const visibleHeight = 2 * Math.tan(fovRadians / 2) * planeDepth;
    const visibleWidth = visibleHeight * camera.aspect;
    field.scale.set(visibleWidth * 1.28, visibleHeight * 1.34, 1);

    // Place the object in the negative-space column on desktop, and upper-right
    // on mobile so the headline and actions remain easy to read.
    const objectDepth = camera.position.z - sculpture.position.z;
    const objectHeight = 2 * Math.tan(fovRadians / 2) * objectDepth;
    const objectWidth = objectHeight * camera.aspect;
    sculpture.position.x = objectWidth * (narrow ? 0.32 : 0.235);
    sculpture.position.y = objectHeight * (narrow ? 0.29 : -0.015);
  }

  /* ---------- restrained interaction ---------- */
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  function onPointer(event) {
    const rect = hero.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
    pointer.x = THREE.MathUtils.clamp(nx, -1, 1);
    pointer.y = THREE.MathUtils.clamp(ny, -1, 1);
    uniforms.uRipple.value.set(pointer.x * 1.35, -pointer.y * 0.85);
  }
  if (finePointer && !narrow) {
    hero.addEventListener("pointermove", onPointer, { passive: true });
    hero.addEventListener("pointerleave", () => {
      pointer.x = 0;
      pointer.y = 0;
    }, { passive: true });
  }

  let ampTarget = uniforms.uAmp.value;
  function onScroll() {
    const rect = hero.getBoundingClientRect();
    const progress = THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height), 0, 1);
    ampTarget = (narrow ? 0.38 : 0.48) + progress * 0.22;
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(hero);
  addEventListener("resize", layout, { passive: true });
  layout();
  hero.classList.add("is-immersive");
  hero.classList.remove("is-fallback");
  canvas.dataset.renderMode = "immersive";

  /* ---------- visibility / reduced-motion aware render loop ---------- */
  let raf = 0;
  let running = false;
  let inView = true;
  let last = performance.now();
  let elapsed = 0;
  let frameCount = 0;
  let measuredSeconds = 0;
  let degraded = false;

  function renderStill() {
    uniforms.uTime.value = 0.9;
    uniforms.uAmp.value = ampTarget;
    renderer.render(scene, camera);
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;

    eased.x += (pointer.x - eased.x) * Math.min(dt * 2.7, 1);
    eased.y += (pointer.y - eased.y) * Math.min(dt * 2.7, 1);
    uniforms.uTime.value = elapsed;
    uniforms.uAmp.value += (ampTarget - uniforms.uAmp.value) * Math.min(dt * 1.8, 1);

    sculpture.rotation.y += dt * (narrow ? 0.075 : 0.12);
    sculpture.rotation.x = Math.sin(elapsed * 0.22) * (narrow ? 0.045 : 0.075) - eased.y * 0.055;
    sculpture.rotation.z = Math.sin(elapsed * 0.18) * 0.035 + eased.x * 0.045;
    core.rotation.x -= dt * 0.055;
    core.rotation.y += dt * 0.08;
    innerCore.rotation.y -= dt * 0.12;
    orbits[0].rotation.z += dt * 0.045;
    orbits[1].rotation.x -= dt * 0.035;
    orbits[2].rotation.y += dt * 0.025;
    points.rotation.y -= dt * 0.018;

    camera.position.x = eased.x * (narrow ? 0.025 : 0.11);
    camera.position.y = -eased.y * (narrow ? 0.02 : 0.065);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);

    if (!degraded) {
      frameCount += 1;
      measuredSeconds += dt;
      if (measuredSeconds >= 2.5) {
        if (frameCount / measuredSeconds < 42) {
          degraded = true;
          renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.0));
          layout();
        }
        frameCount = 0;
        measuredSeconds = 0;
      }
    }
  }

  function play() {
    if (running || reduced.matches || document.hidden || !inView) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) {
        if (reduced.matches) renderStill();
        else play();
      } else {
        pause();
      }
    }, { threshold: 0.01 }).observe(hero);
  }

  function onVisibilityChange() {
    if (document.hidden) pause();
    else if (reduced.matches) renderStill();
    else play();
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  reduced.addEventListener?.("change", (event) => {
    if (event.matches) {
      pause();
      renderStill();
    } else {
      play();
    }
  });

  if (reduced.matches) renderStill();
  else play();

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    pause();
    bail();
  });

  addEventListener("pagehide", () => {
    pause();
    resizeObserver.disconnect();
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", layout);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (finePointer && !narrow) hero.removeEventListener("pointermove", onPointer);
    plane.dispose();
    fieldMaterial.dispose();
    halo.geometry.dispose();
    halo.material.dispose();
    core.geometry.dispose();
    core.material.dispose();
    innerCore.geometry.dispose();
    innerCore.material.dispose();
    orbits.forEach((orbit) => {
      orbit.geometry.dispose();
      orbit.material.dispose();
    });
    pointGeometry.dispose();
    pointMaterial.dispose();
    renderer.dispose();
  });
}
