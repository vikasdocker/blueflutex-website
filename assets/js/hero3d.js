/* =========================================================
   BlueFluteX — hero resonance field

   A subdivided plane displaced by the shader in shaders.js, viewed
   in perspective so it reads as a surface rather than a texture.

   Three.js comes from a CDN via the import map in index.html — see
   the note there for why it is not bundled.

   Failure is a supported path, not an exception: no WebGL, no CDN,
   or a context-loss all fall back to the CSS gradient already in the
   markup, and nothing is logged to the page.
   ========================================================= */
import * as THREE from "three";
import { VERT, FRAG } from "./shaders.js";

const canvas = document.getElementById("resonance");
const hero = document.querySelector(".hero");

/* ---------- bail out cleanly ---------- */
function bail() {
  // tell the stylesheet to show the static gradient
  hero?.classList.add("is-fallback");
  canvas?.remove();
}

if (!canvas || !hero) {
  // nothing to attach to; the hero still reads fine without it
} else if (window.WebGLRenderingContext) {
  try {
    boot();
  } catch {
    bail();
  }
} else {
  bail();
}

function boot() {
  /* ---------- palette, pulled from site.css so there is one source ---------- */
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => (css.getPropertyValue(name) || fallback).trim();
  const INK = new THREE.Color(token("--ink", "#14110f"));
  const ACCENT = new THREE.Color(token("--teal", "#0f5c56"));

  /* ---------- renderer ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,          // paper shows through; clear alpha stays 0
      powerPreference: "high-performance",
    });
  } catch {
    bail();
    return;
  }

  // Cap DPR at 2, then step down if the frame budget is being missed.
  // Uncapped DPR is the usual reason "simple" 3D stutters on phones.
  const CAP = 2;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CAP));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

  /* ---------- geometry ----------
     Segments are the only real cost here: 1 mesh, no per-vertex objects.
     Reduced on narrow screens where the extra tessellation buys nothing. */
  const narrow = matchMedia("(max-width: 780px)").matches;
  const SEG_X = narrow ? 110 : 190;
  const SEG_Y = narrow ? 80 : 140;

  const geo = new THREE.PlaneGeometry(1, 1, SEG_X, SEG_Y);

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.55 },
    uRipple: { value: new THREE.Vector2(0, 0) },
    uInk: { value: INK },
    uAccent: { value: ACCENT },
    uRes: { value: new THREE.Vector2(1, 1) },
    uBands: { value: 34.0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, material);
  // tilt the top edge away from the camera so the surface has a horizon
  mesh.rotation.x = -0.30;
  scene.add(mesh);

  /* ---------- layout ----------
     Size the plane from the camera frustum so it always overfills the
     viewport — no letterboxing when the window is resized or rotated. */
  const Z = 4.2;
  camera.position.set(0, 0, Z);
  camera.lookAt(0, -0.12, 0);

  function layout() {
    const w = canvas.clientWidth || hero.clientWidth;
    const h = canvas.clientHeight || hero.clientHeight;
    if (!w || !h) return;

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CAP));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // gl_FragCoord is in device pixels, so the shader's screen-space
    // falloffs need the drawing-buffer size, not the CSS size
    const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
    uniforms.uRes.value.set(buf.x, buf.y);

    // fit at the far edge of the plane, where the tilt compresses it most
    const vFov = (camera.fov * Math.PI) / 180;
    const depth = Z * 1.34;
    const height = 2 * Math.tan(vFov / 2) * depth;
    const width = height * camera.aspect;

    mesh.scale.set(width * 1.25, height * 1.25, 1);
  }

  /* ---------- pointer parallax (lerped, so it trails the cursor) ---------- */
  const pointer = { x: 0, y: 0 };   // target
  const eased = { x: 0, y: 0 };     // current

  function onPointer(e) {
    const nx = (e.clientX / innerWidth) * 2 - 1;
    const ny = (e.clientY / innerHeight) * 2 - 1;
    pointer.x = nx;
    pointer.y = ny;
    // ripple origin in plane-local space
    uniforms.uRipple.value.set(nx * 1.5, -ny * 0.95);
  }
  addEventListener("pointermove", onPointer, { passive: true });

  /* ---------- scroll-linked amplitude ----------
     The field starts nearly flat and gains energy as the hero scrolls
     away, so the motion is tied to reading progress rather than idling. */
  let ampTarget = 0.55;
  function onScroll() {
    const y = scrollY || 0;
    const h = innerHeight || 1;
    ampTarget = 0.55 + Math.min(y / h, 1) * 0.55;
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- resize ---------- */
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);
  addEventListener("resize", layout);
  layout();

  /* ---------- reduced motion: one static frame, then stop ---------- */
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  let raf = 0;
  let last = performance.now();
  let elapsed = 0;

  // adaptive quality: if we average under ~45fps, shed pixel ratio once
  let frames = 0;
  let acc = 0;
  let degraded = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);

    // delta-time, never frame counts — the same motion at 60Hz and 120Hz
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;

    eased.x += (pointer.x - eased.x) * Math.min(dt * 3.2, 1);
    eased.y += (pointer.y - eased.y) * Math.min(dt * 3.2, 1);

    uniforms.uTime.value = elapsed;
    uniforms.uAmp.value += (ampTarget - uniforms.uAmp.value) * Math.min(dt * 2.4, 1);

    // camera drifts against the pointer, plus a slow idle breath
    camera.position.x = eased.x * 0.34;
    camera.position.y = -eased.y * 0.22;
    camera.lookAt(0, -0.12, 0);

    renderer.render(scene, camera);

    if (!degraded) {
      frames += 1;
      acc += dt;
      if (acc > 2.5) {
        if (frames / acc < 45) {
          degraded = true;
          renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
          layout();
        }
        frames = 0;
        acc = 0;
      }
    }
  }

  function play() {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  if (reduced.matches) {
    const still = () => {
      uniforms.uAmp.value = ampTarget;
      uniforms.uTime.value = 12;
      renderer.render(scene, camera);
    };
    still();

    // Respect the setting changing mid-session without a reload: settle on a
    // still frame, or resume if they switched it back off.
    reduced.addEventListener?.("change", (e) => {
      cancelAnimationFrame(raf);
      if (e.matches) still();
      else {
        last = performance.now();
        play();
      }
    });
  } else {
    play();
  }

  /* ---------- stop when off-screen ----------
     A WebGL context that keeps rendering behind a long page is pure
     battery cost. This is the single biggest win on mobile. */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (reduced.matches) return;
        entry.isIntersecting ? play() : cancelAnimationFrame(raf);
      },
      { threshold: 0 }
    ).observe(canvas);
  }

  /* ---------- context loss ---------- */
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    bail();
  });

  /* ---------- teardown ---------- */
  addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    removeEventListener("pointermove", onPointer);
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", layout);
    geo.dispose();
    material.dispose();
    renderer.dispose();
  });
}