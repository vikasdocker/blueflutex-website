/* Shared projection and camera math; also loadable by the source checks. */
((root) => {
  "use strict";
  const spacing = 1200;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const path = t => ({ x: Math.sin(t * .8) * 340, y: Math.cos(t * .55) * 180 });
  const camera = (progress, blend, pointerX = 0, pointerY = 0) => {
    const point = path(progress + .7);
    return { x: (point.x + pointerX * 48) * blend, y: (point.y - pointerY * 34) * blend, z: progress * spacing * blend };
  };
  const card = index => {
    const point = path(index + 1);
    return { x: point.x + Math.sin(index * 1.9) * 90, y: point.y + Math.sin(index * 1.3) * 60, z: (index + 1) * spacing };
  };
  const project = (point, cam, width, height, blend) => {
    const depth = point.z - cam.z;
    const focal = Math.min(width, height) * 1.12;
    return {
      depth, scale: focal / Math.max(depth, 1),
      x: width * (.52 - blend * .02) + (point.x - cam.x) * focal / Math.max(depth, 1),
      y: height * (.42 + blend * .04) - (point.y - cam.y) * focal / Math.max(depth, 1),
    };
  };
  const api = { spacing, clamp, ease, path, camera, card, project };
  root.BlueFluteFlightMath = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window === "undefined" ? globalThis : window);
