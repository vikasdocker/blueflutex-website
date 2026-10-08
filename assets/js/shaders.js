/* =========================================================
   BlueFluteX — hero shaders

   The logo is drawn as topographic contour lines, so the hero
   renders the same idea in three dimensions: a displaced surface
   whose fragment pass draws anti-aliased iso-height contours.
   Ink lines on paper, with the accent appearing only on the
   highest crests.

   Lines are derived from fwidth() of the height field, which keeps
   them a constant pixel width regardless of how steep the surface
   is or where the camera is. That is what stops the pattern from
   aliasing into moire at grazing angles.
   ========================================================= */

/* ---------- shared height field ----------
   Kept identical in both stages so the contour bands line up with
   the actual geometry instead of drifting off it. */
const FIELD = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // cheap value noise — enough character for a surface this smooth,
  // and far cheaper than simplex here
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float field(vec2 p, float t, float amp, vec2 rippleAt) {
    float h = 0.0;

    // three crossing trains — this is the "harmony" motif, periodic
    // waves that individually go nowhere but interfere into structure
    h += sin(p.x * 1.10 + t * 0.52) * 0.52;
    h += sin(p.y * 1.62 - t * 0.41) * 0.33;
    h += sin((p.x * 0.68 + p.y * 1.05) + t * 0.74) * 0.24;

    // radial pulse travelling out from the pointer
    float d = length(p - rippleAt);
    h += sin(d * 3.1 - t * 1.35) * 0.20 * exp(-d * 0.55);

    // low-frequency swell keeps the large-scale silhouette alive.
    // Kept quiet so it perturbs the interference pattern instead of
    // burying it — the waves are the subject, not the terrain.
    h += (noise(p * 0.42 + vec2(t * 0.06, -t * 0.04)) - 0.5) * 0.45;

    return h * amp;
  }
`;

export const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform vec2  uRipple;

  varying float vH;
  varying float vFade;

  ${FIELD}

  void main() {
    float h = field(position.xy, uTime, uAmp, uRipple);

    vec3 p = position + vec3(0.0, 0.0, h);

    vH = h;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // atmospheric fade: distance from the camera in view space
    vFade = smoothstep(7.5, 2.0, -mv.z);

    gl_Position = projectionMatrix * mv;
  }
`;

export const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uInk;
  uniform vec3  uAccent;
  uniform vec2  uRes;
  uniform float uAmp;
  uniform float uBands;

  varying float vH;
  varying float vFade;

  void main() {
    // one contour unit per band; fwidth gives us the local rate of change
    // so the line width stays ~1.5px on screen at any slope
    float s  = (vH + 1.6) * uBands;
    float fw = fwidth(s);
    float f  = abs(fract(s) - 0.5);
    float line = 1.0 - smoothstep(0.0, fw * 1.4, f - fw * 0.5);

    vec2 uv = gl_FragCoord.xy / uRes;

    // Hold the copy column clear. The headline is the product here, so the
    // field fades in from the left rather than sitting behind the text.
    float copy = smoothstep(0.04, 0.66, uv.x);

    // and dissolve at the top/bottom so the plane never hard-clips
    float edge = smoothstep(0.0, 0.16, uv.y) * smoothstep(1.0, 0.84, uv.y);

    // accent only on the upper crests, so colour reads as emphasis.
    // vH is scaled by uAmp, so the threshold tracks the amplitude rather
    // than assuming a fixed crest height.
    float crest = smoothstep(0.22, 0.62, vH * max(uAmp, 0.001));
    vec3 col = mix(uInk, uAccent, crest * 0.9);

    float alpha = line * vFade * copy * edge * (0.19 + crest * 0.34);

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;