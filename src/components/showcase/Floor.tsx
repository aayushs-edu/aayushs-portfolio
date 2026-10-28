"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { NAME } from "../hero/heroConfig";
import { VIVID } from "../hero/splitConfig";
import type { FloorPlan, Passage } from "./layouts/types";
import { SHOWCASE } from "./showcaseConfig";

// The floor: linen on the art side, the dot grid on the code side, as on the
// hero's wall. In the split layout a fluid off-white line (the hero's seam)
// runs down the middle and, on the full tier, thin strokes of paint flow off
// its art side and packets of bits off its code side. In the chapters layout
// the floor changes side at each passage, where a wall split on the same kind
// of line opens as the camera nears.

const MAX_PLANES = 4;

/** Raw sRGB components: these shaders write display values straight out (no colour management), like the scene's background. */
const color = (hex: string) => new THREE.Color(hex).convertLinearToSRGB();

/** Shared GLSL: hashing, the two surfaces, fog. Lengths are metres. */
const COMMON = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTime;

float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Primed linen: a plain weave, each thread a slightly different tone. Fades to
// flat where its threads get smaller than a pixel or two.
vec3 linen(vec2 p) {
  vec2 q = p / 0.016;
  vec2 i = floor(q);
  vec2 f = fract(q);
  bool warp = mod(i.x + i.y, 2.0) < 1.0;
  float tone = warp ? hash21(vec2(i.x, 3.7)) : hash21(vec2(5.1, i.y));
  float across = warp ? f.x : f.y;
  float shade = 1.0 - 4.0 * (across - 0.5) * (across - 0.5);
  float v = 0.55 * (tone - 0.5) + 0.45 * (shade - 0.5);
  float k = 1.0 - smoothstep(0.25, 0.7, max(fwidth(q.x), fwidth(q.y)));
  return vec3(0.078, 0.071, 0.063) * (1.0 + 0.55 * v * k);
}

// The dot grid: a faint dot every 14 cm.
vec3 dots(vec2 p) {
  vec2 g = p / 0.14;
  vec2 d = (fract(g) - 0.5) * 0.14;
  float aa = max(fwidth(p.x), fwidth(p.y));
  float dotA = 1.0 - smoothstep(0.011 - aa, 0.011 + aa, length(d));
  float k = 1.0 - smoothstep(0.12, 0.45, max(fwidth(g.x), fwidth(g.y)));
  return mix(vec3(0.062, 0.062, 0.066), vec3(1.0), 0.12 * dotA * k);
}

vec3 fog(vec3 col, vec3 world) {
  float d = length(world - cameraPosition) * uFogDensity;
  return mix(col, uFogColor, 1.0 - exp(-d * d));
}
`;

const FLOOR_VERTEX = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const FLOOR_FRAGMENT = /* glsl */ `
#define MAX_PLANES ${MAX_PLANES}
${COMMON}
uniform float uSpine;           // 1: split by the spine
uniform vec4 uPlanes[MAX_PLANES];
uniform int uPlaneCount;
uniform float uSides[MAX_PLANES + 1]; // 0 art, 1 code
uniform float uEffects;
uniform vec3 uPalette[6];
uniform vec3 uSpineColor;
varying vec3 vWorld;

// The spine: the hero's line, carried on down the floor (x at depth z).
float spineX(float z) {
  return 0.1 * sin(z * 0.31 + uTime * 0.35) + 0.05 * sin(z * 0.83 - uTime * 0.6 + 1.3);
}

// Thin strokes of paint pushing out of the spine's art side, one lane each.
vec4 strokes(vec2 p, float q) {
  float lane = 0.42;
  float j = floor(p.y / lane);
  if (hash11(j * 1.7) > 0.45 || q < 0.0) return vec4(0.0);
  float period = 7.0 + 5.0 * hash11(j * 3.1);
  float age = fract(uTime / period + hash11(j * 5.3));
  float reach = 1.0 + 2.2 * hash11(j * 7.9);
  float front = reach * smoothstep(0.0, 0.7, age);
  float tail = reach * smoothstep(0.45, 1.0, age);
  if (q < tail || q > front) return vec4(0.0);
  float along = (q - tail) / max(front - tail, 1e-3);
  float zc = (j + 0.5) * lane + 0.07 * sin(q * 2.6 - uTime * 0.8 + j) * min(q, 1.0);
  float hw = 0.02 * mix(1.0, 0.25, along);
  float aa = fwidth(p.y);
  float a = 1.0 - smoothstep(hw - aa, hw + aa, abs(p.y - zc));
  // Dry toward its tip.
  a *= 1.0 - smoothstep(0.6, 1.0, along) * step(0.45, hash21(vec2(floor(q / 0.02), j)));
  vec3 col = uPalette[int(min(5.0, floor(hash11(j * 9.7) * 6.0)))] * 0.85;
  return vec4(col, a);
}

// Packets of bits drifting out of the spine's code side, one lane each.
vec4 bits(vec2 p, float q) {
  float lane = 0.085;
  float cw = 0.055;
  float j = floor(p.y / lane);
  if (hash11(j * 2.3) > 0.22 || q < 0.0) return vec4(0.0);
  float period = 6.0 + 4.0 * hash11(j * 4.1);
  float age = fract(uTime / period + hash11(j * 6.7)) * period;
  float lead = (0.25 + 0.35 * hash11(j * 8.3)) * age;
  float n = 1.0 + floor(pow(hash11(j * 1.1 + floor(uTime / period)), 2.0) * 6.0);
  if (q > lead || q < lead - n * cw) return vec4(0.0);
  float k = floor((lead - q) / cw);
  vec2 uv = vec2(fract((lead - q) / cw), fract(p.y / lane));
  float digit = step(0.5, hash21(vec2(k + j, floor(age * 0.7))));
  vec2 c = uv - 0.5;
  float aa = 0.08;
  float glyph = digit > 0.5
    ? (1.0 - smoothstep(0.07, 0.07 + aa, abs(c.y))) * (1.0 - smoothstep(0.28, 0.28 + aa, abs(c.x)))
    : (1.0 - smoothstep(0.08, 0.08 + aa, abs(length(c / vec2(0.32, 0.22)) - 0.85) * 0.25));
  float life = 1.0 - smoothstep(0.6 * period, 0.9 * period, age);
  vec3 col = uPalette[int(min(5.0, floor(hash11(j * 3.3) * 6.0)))];
  col = mix(vec3(1.0, 0.98, 0.94), col, smoothstep(0.0, 0.4, age));
  return vec4(col, glyph * life);
}

void main() {
  vec2 p = vWorld.xz;
  bool art;
  float spine = spineX(p.y);
  if (uSpine > 0.5) {
    art = p.x < spine;
  } else {
    int k = 0;
    for (int i = 0; i < MAX_PLANES; i++) {
      if (i >= uPlaneCount) break;
      if (dot(p - uPlanes[i].xy, uPlanes[i].zw) > 0.0) k++;
    }
    float side = uSides[0];
    for (int i = 1; i <= MAX_PLANES; i++) if (i == k) side = uSides[i];
    art = side < 0.5;
  }
  vec3 col = art ? linen(p) : dots(p);
  if (uSpine > 0.5) {
    if (uEffects > 0.5) {
      vec4 s = art ? strokes(p, spine - p.x) : bits(p, p.x - spine);
      col = mix(col, s.rgb, s.a);
    }
    float aa = fwidth(p.x) * 1.2;
    float line = 1.0 - smoothstep(0.016 - aa, 0.016 + aa, abs(p.x - spine));
    col = mix(col, uSpineColor, line * 0.9);
  }
  gl_FragColor = vec4(fog(col, vWorld), 1.0);
}
`;

const GATE_VERTEX = /* glsl */ `
varying vec3 vWorld;
varying vec2 vLocal;
void main() {
  vLocal = position.xy;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const GATE_FRAGMENT = /* glsl */ `
${COMMON}
uniform float uOpen;  // how far each half has moved away from the line (m)
uniform vec3 uEdge;
varying vec3 vWorld;
varying vec2 vLocal;

float seamX(float y) {
  return 0.12 * sin(y * 1.3 + uTime * 0.45) + 0.06 * sin(y * 3.1 - uTime * 0.8);
}

void main() {
  float x = vLocal.x;
  float line = seamX(vLocal.y);
  vec2 p;
  bool art;
  if (x < line - uOpen) {
    p = vec2(x + uOpen, vLocal.y);
    art = true;
  } else if (x > line + uOpen) {
    p = vec2(x - uOpen, vLocal.y);
    art = false;
  } else {
    discard;
  }
  vec3 col = art ? linen(p) : dots(p);
  float aa = fwidth(p.x) * 1.2;
  float edge = 1.0 - smoothstep(0.012 - aa, 0.012 + aa, abs(p.x - line));
  col = mix(col, uEdge, edge * 0.9);
  gl_FragColor = vec4(fog(col, vWorld), 1.0);
}
`;

/**
 * A shader material built here rather than through R3F props: R3F copies
 * uniforms into new objects, and these are written every frame.
 */
function useShader(vertexShader: string, fragmentShader: string, uniforms: Record<string, THREE.IUniform>, side: THREE.Side = THREE.FrontSide) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uFogColor: { value: color(SHOWCASE.background) }, uFogDensity: { value: SHOWCASE.fog }, uTime: { value: 0 }, ...uniforms },
        side,
      }),
    [vertexShader, fragmentShader, uniforms, side],
  );
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

export function Floor({ plan, effects }: { plan: FloorPlan; effects: boolean }) {
  const uniforms = useMemo(() => {
    const planes = Array.from({ length: MAX_PLANES }, (_, i) => new THREE.Vector4(...(plan.planes[i] ?? [0, 0, 0, 0])));
    const sides = Array.from({ length: MAX_PLANES + 1 }, (_, i) => (plan.sides[Math.min(i, plan.sides.length - 1)] === "code" ? 1 : 0));
    return {
      uSpine: { value: plan.spine ? 1 : 0 },
      uPlanes: { value: planes },
      uPlaneCount: { value: Math.min(MAX_PLANES, plan.planes.length) },
      uSides: { value: sides },
      uEffects: { value: effects ? 1 : 0 },
      uPalette: { value: VIVID.map(color) },
      uSpineColor: { value: color(NAME.paint) },
    };
  }, [plan, effects]);
  const material = useShader(FLOOR_VERTEX, FLOOR_FRAGMENT, uniforms);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  const [minX, maxX, minZ, maxZ] = plan.bounds;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[(minX + maxX) / 2, 0, (minZ + maxZ) / 2]} material={material}>
      <planeGeometry args={[maxX - minX, maxZ - minZ]} />
    </mesh>
  );
}

/** Gate size (m), wide and tall enough that its edges are lost in the fog; it starts opening this far from the camera and is open by `openAt`. */
const GATE = { width: 16, height: 8, opensFrom: 5.5, openAt: 1.5 };

/** A passage's wall, split on a fluid line; it opens as the camera nears. */
export function Gate({ passage }: { passage: Passage }) {
  const uniforms = useMemo(() => ({ uOpen: { value: 0 }, uEdge: { value: color(NAME.paint) } }), []);
  const material = useShader(GATE_VERTEX, GATE_FRAGMENT, uniforms, THREE.DoubleSide);
  const [x, , z] = passage.position;

  useFrame(({ camera }, delta) => {
    material.uniforms.uTime.value += Math.min(delta, 0.05);
    const t = THREE.MathUtils.clamp((GATE.opensFrom - Math.hypot(camera.position.x - x, camera.position.z - z)) / (GATE.opensFrom - GATE.openAt), 0, 1);
    material.uniforms.uOpen.value = t * t * (3 - 2 * t) * (GATE.width / 2 + 0.5);
  });

  return (
    <mesh position={[x, GATE.height / 2, z]} rotation-y={passage.rotationY} material={material}>
      <planeGeometry args={[GATE.width, GATE.height]} />
    </mesh>
  );
}
