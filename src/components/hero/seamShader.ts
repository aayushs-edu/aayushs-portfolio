// GLSL for the seam. The line is a fluid curve (sampled on the CPU). Left of
// it: paint ribbons push out and float away (one distance field, lit as wet
// paint), and over them the painted name. Right of it: bits pop out of the
// line (splashes of digit packets along the binary grid's rows that burst out,
// brake, drift and fade), and over them the binary name. Both halves of the
// name are drawn through the fluid flow of nameGL.ts.

import { DESIGN } from "./heroConfig";
import { MAX_POPS, MAX_STREAMS } from "./seamField";
import { CURVE } from "./splitConfig";

/** The line: its samples, and where it is at height y (x from the centre, CSS px). */
export const CURVE_GLSL = /* glsl */ `
#define CURVE_SAMPLES ${CURVE.samples}
uniform vec4 uCurve[CURVE_SAMPLES / 4];
uniform float uHeight;
float curveSample(int i) {
  vec4 v = uCurve[i >> 2];
  int k = i & 3;
  return k == 0 ? v.x : k == 1 ? v.y : k == 2 ? v.z : v.w;
}

// Where the line is at height y (x from the centre, CSS px).
float curveAt(float y) {
  float f = clamp(y / uHeight, 0.0, 1.0) * float(CURVE_SAMPLES - 1);
  int i = min(int(floor(f)), CURVE_SAMPLES - 2);
  return mix(curveSample(i), curveSample(i + 1), f - float(i));
}
`;

export const SEAM_VERTEX = /* glsl */ `#version 300 es
void main() {
  // One triangle that covers the canvas.
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

export const SEAM_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

#define MAX_STREAMS ${MAX_STREAMS}
#define MAX_POPS ${MAX_POPS}

uniform vec2 uRes;            // canvas size (device px)
uniform float uDpr;
uniform float uSeam;          // seam x in the canvas (CSS px)
uniform float uUnit;          // CSS px per design px
uniform vec2 uCell;           // binary cell size (CSS px)
uniform float uGridY;         // top of grid row 0 (CSS px)
uniform float uTime;
uniform int uCount;
uniform vec4 uA[MAX_STREAMS]; // the line's x at the ribbon's height, centre y, tail, front
uniform vec4 uB[MAX_STREAMS]; // body radius, leading-edge radius, wave amplitude, wave number
uniform vec4 uC[MAX_STREAMS]; // colour index, seed, flow, wave phase
uniform vec3 uPalette[7];     // six pigments, then the seam's own paint
uniform float uBead;          // seam bead half-width (CSS px)
uniform float uBeadSwell;
uniform float uBlend;         // smooth-union radius (CSS px)
uniform sampler2D uGlyphs;    // "0" and "1", white on transparent
uniform vec2 uGlyphRes;       // atlas size (device px)
uniform float uGlyphSlot;     // atlas slot width (device px)
uniform int uPopCount;
uniform vec4 uPop[MAX_POPS];  // centre row, age (s), seed (negative: flies left), origin (x from the centre)
uniform vec4 uBitShape;       // rows either side, row chance, max packet length, flip rate
uniform vec4 uBurst;          // burst speed min/max, drift speed min/max (CSS px/s)
uniform vec4 uBitTime;        // burst decay (s), life min/max (s), cooling time (s)
// The name
uniform float uNameOn;        // 0 until the name's textures are ready (the DOM name shows meanwhile)
uniform float uFlowOn;        // 1 while the fluid is moving
uniform vec4 uBox;            // title box on the canvas (CSS px): x, y, w, h
uniform vec3 uGridInfo;       // binary grid: first column, columns, rows
uniform vec3 uNameInk;        // binary digits
uniform vec3 uNameBacking;    // binary cells
uniform sampler2D uNamePaint; // the painted name (premultiplied)
uniform sampler2D uNameMask;  // binary cells: 0 none, 0.5 a "0", 1 a "1"
uniform sampler2D uNameHoles; // 1 knocked out, 0.5 being retyped
uniform sampler2D uFlow;      // where each point's paint came from (uv over the title box)
${CURVE_GLSL}

out vec4 outColor;

float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise1(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash11(i), hash11(i + 1.0), f * f * (3.0 - 2.0 * f));
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// ---- Paint -----------------------------------------------------------------

// The thin wet bead that traces the line.
float bead(vec2 p) {
  float c = curveAt(p.y);
  float slope = (curveAt(p.y + 1.0) - curveAt(p.y - 1.0)) * 0.5;
  return abs(p.x - c) / sqrt(1.0 + slope * slope) - (uBead + uBeadSwell * noise1(p.y / (60.0 * uUnit) - uTime * 0.12));
}

// Centre line of a ribbon at outward distance q: it leaves the seam level,
// then a wave travels out along it.
float centre(int i, float q, out float slope) {
  vec4 a = uA[i];
  vec4 b = uB[i];
  float env = smoothstep(0.0, 3.0 * b.y + 1.0, q);
  float arg = q * b.w - uC[i].w;
  slope = b.z * env * b.w * cos(arg);
  return a.y + b.z * env * sin(arg);
}

bool near(int i, vec2 p) {
  vec4 a = uA[i];
  vec4 b = uB[i];
  float q = a.x - p.x;
  float reach = b.y * 1.6 + uBlend;
  return b.y > 0.05 && q > a.z - reach && q < a.w + reach && abs(p.y - a.y) < b.z + reach;
}

// One ribbon: a stroke of paint drawn out from the line, thick and wet at the
// root and tapering toward its tip. Returns distance, local half-width, offset
// across it and distance along it (carried with the flow); frac is how far
// along the stroke this is (0 at the root, 1 at the tip).
vec4 ribbon(int i, vec2 p, out float frac) {
  vec4 a = uA[i];
  vec4 b = uB[i];
  vec4 c = uC[i];
  float q = a.x - p.x; // outward from where the line is at this ribbon's height
  // While attached, the root runs on under the line (which clips it), so it always meets the line.
  float tail = a.z > 0.0 ? a.z : -b.y;
  float qc = clamp(q, tail, a.w);
  float slope;
  float yc = centre(i, qc, slope);
  float root = max(tail, 0.0);
  frac = clamp((qc - root) / max(a.w - root, b.x), 0.0, 1.0);
  // Tapers toward the tip, with gentle swells that travel out with the paint.
  float r = b.x * mix(1.0, 0.3, pow(frac, 1.3)) * (0.9 + 0.2 * noise1((qc - c.z) / (55.0 * uUnit) + c.y));
  float across = p.y - yc;
  float d = q < tail || q > a.w ? length(vec2(q - qc, across)) - r : abs(across) / sqrt(1.0 + slope * slope) - r;
  return vec4(d, r, across, q - c.z);
}

// Distance only: for normals. Paint stays on its side of the line.
float field(vec2 p) {
  float d = bead(p);
  float frac;
  for (int i = 0; i < MAX_STREAMS; i++) {
    if (i >= uCount) break;
    if (!near(i, p)) continue;
    d = smin(d, ribbon(i, p, frac).x, uBlend);
  }
  return max(d, p.x - curveAt(p.y));
}

struct Sample {
  float d;
  vec3 col;
  // Of the nearest stroke: offset across it, distance along it, its half-width here, how far along it
  float across;
  float along;
  float width;
  float frac;
};

// Distance plus what the paint is made of here. Each ribbon weighs in by how
// close it is, with a little noise, so colours marble where ribbons merge.
Sample sampleField(vec2 p) {
  float db = bead(p);
  vec4 rs[MAX_STREAMS];
  float fs[MAX_STREAMS];
  float d = db;
  float dmin = db;
  for (int i = 0; i < MAX_STREAMS; i++) {
    rs[i] = vec4(1e5, 0.0, 0.0, 0.0);
    fs[i] = 0.0;
    if (i >= uCount || !near(i, p)) continue;
    rs[i] = ribbon(i, p, fs[i]);
    d = smin(d, rs[i].x, uBlend);
    dmin = min(dmin, rs[i].x);
  }
  float sigma = 2.0 * uUnit;
  // The seam's own off-white only shows on the bead itself, not where a ribbon leaves it.
  float wb = 0.15 * exp(-(db - dmin) / sigma);
  vec3 col = uPalette[6] * wb;
  float wsum = wb;
  float best = db;
  Sample s = Sample(max(d, p.x - curveAt(p.y)), vec3(0.0), 0.0, 0.0, 0.0, 0.0);
  for (int i = 0; i < MAX_STREAMS; i++) {
    if (rs[i].x > 1e4) continue;
    float marble = (noise2(p / (12.0 * uUnit) + float(i) * 7.0) - 0.5) * 3.0 * uUnit;
    float w = exp(-(rs[i].x + marble - dmin) / sigma);
    col += uPalette[int(uC[i].x)] * w;
    wsum += w;
    if (rs[i].x < best) {
      best = rs[i].x;
      s.width = rs[i].y;
      s.across = rs[i].z;
      s.along = rs[i].w;
      s.frac = fs[i];
    }
  }
  s.col = col / wsum;
  return s;
}

// A layer of paint: flat on top, rounded off within lambda of its edge.
float heightAt(float d, float lambda) {
  float x = clamp(-d / lambda, 0.0, 1.0);
  return lambda * (2.0 * x - x * x);
}

vec3 normalAt(vec2 p, float lambda) {
  float e = 1.0 / uDpr;
  float hx = heightAt(field(p + vec2(e, 0.0)), lambda) - heightAt(field(p - vec2(e, 0.0)), lambda);
  float hy = heightAt(field(p + vec2(0.0, e)), lambda) - heightAt(field(p - vec2(0.0, e)), lambda);
  return normalize(vec3(-0.35 * hx / (2.0 * e), -0.35 * hy / (2.0 * e), 1.0));
}

const vec3 LIGHT = vec3(-0.44, -0.61, 0.66); // from the upper left (y is down)

vec4 paint(vec2 p) {
  float d = field(p);
  float alpha = clamp(0.5 - d * uDpr, 0.0, 1.0);
  if (alpha <= 0.0) return vec4(0.0);
  Sample s = sampleField(p);
  // Bristle marks run along the stroke and travel out with the paint.
  vec2 sp = vec2(s.along / (34.0 * uUnit), s.across / (1.2 * uUnit));
  float bristle = noise2(sp);
  // The stroke runs dry toward its tip (and a little along its edges): the paint
  // breaks up into bristle marks there.
  float edge = s.width > 0.0 ? clamp(abs(s.across) / s.width, 0.0, 1.0) : 0.0;
  float dry = max(smoothstep(0.45, 1.0, s.frac), 0.5 * smoothstep(0.7, 1.0, edge));
  alpha *= 1.0 - dry * (1.0 - smoothstep(0.36, 0.6, bristle));
  if (alpha <= 0.0) return vec4(0.0);
  // Flat on top with rounded edges, and ridges along the bristle marks that catch the light.
  vec3 n = normalAt(p, 2.5 * uUnit);
  float ridge = noise2(sp + vec2(0.0, 0.5)) - noise2(sp - vec2(0.0, 0.5));
  n = normalize(n + vec3(0.0, ridge * 0.4, 0.0));
  vec3 l = normalize(LIGHT);
  float diffuse = max(dot(n, l), 0.0);
  float specular = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 70.0);
  vec3 albedo = s.col * (0.9 + 0.2 * bristle);
  // Thin paint at the very edge sits a touch darker.
  albedo *= mix(0.86, 1.0, smoothstep(0.0, 2.0 * uUnit, -s.d));
  vec3 col = albedo * (0.8 + 0.28 * diffuse) + vec3(1.0, 0.98, 0.94) * specular * 0.4;
  return vec4(col * alpha, alpha);
}

// ---- Bits ------------------------------------------------------------------

// Each pop spits packets of digits along a few neighbouring rows. A packet
// bursts out of the line, brakes, then drifts; it leaves white-hot and cools to
// the pop's pigment; a digit flips now and again; it fades out at the end of
// the pop's life.
vec4 bits(vec2 p) {
  float row = floor((p.y - uGridY) / uCell.y);
  float top = uGridY + row * uCell.y;
  float cw = uCell.x;
  for (int i = 0; i < MAX_POPS; i++) {
    if (i >= uPopCount) break;
    vec4 pop = uPop[i];
    float dir = pop.z < 0.0 ? -1.0 : 1.0;
    pop.z = abs(pop.z);
    float dr = row - pop.x;
    float spread = floor(hash11(pop.z * 3.7) * (uBitShape.x + 0.999));
    if (abs(dr) > spread) continue;
    if (dr != 0.0 && hash21(vec2(pop.z, dr)) > uBitShape.y) continue;
    float age = pop.y;
    // Rows further from the centre of the splash leave a little slower.
    float burst = mix(uBurst.x, uBurst.y, hash21(vec2(pop.z + 1.3, dr))) * (1.0 - 0.3 * abs(dr) / max(spread, 1.0));
    float drift = mix(uBurst.z, uBurst.w, hash21(vec2(dr, pop.z + 5.1)));
    float lead = burst * uBitTime.x * (1.0 - exp(-age / uBitTime.x)) + drift * age;
    float len = 1.0 + floor(pow(hash21(vec2(pop.z + 9.7, dr)), 1.8) * uBitShape.z);
    float x = (p.x - pop.w) * dir;
    if (x > lead || x < lead - len * cw) continue;
    float k = floor((lead - x) / cw);
    float left = dir > 0.0 ? pop.w + lead - (k + 1.0) * cw : pop.w - lead + k * cw;
    float flip = floor(age * uBitShape.w + hash21(vec2(k, pop.z)) * 7.0);
    float bit = step(0.5, hash21(vec2(pop.z * 13.0 + k, dr + flip * 31.0)));
    vec2 local = vec2(p.x - left, p.y - top) * uDpr;
    float glyph = texture(uGlyphs, (vec2(bit * uGlyphSlot, 0.0) + local) / uGlyphRes).a;
    float life = mix(uBitTime.y, uBitTime.z, hash11(pop.z * 5.9));
    float a = glyph * (1.0 - smoothstep(0.55 * life, life, age));
    if (a <= 0.0) continue;
    // Mostly the six pigments; now and then the name's off-white.
    vec3 col = uPalette[int(min(6.0, floor(hash11(pop.z * 2.3) * 6.5)))];
    col = mix(vec3(1.0, 0.98, 0.94), col, smoothstep(0.0, uBitTime.w, age));
    return vec4(col * a, a);
  }
  return vec4(0.0);
}

// ---- The name ------------------------------------------------------------------

const vec2 DESIGN_BOX = vec2(${DESIGN.titleBox.w}.0, ${DESIGN.titleBox.h}.0);

// Title-box uv of a point (x from the centre).
vec2 boxUv(vec2 p) {
  return (vec2(p.x + uSeam, p.y) - uBox.xy) / uBox.zw;
}

// Where the paint at uv came from, after the fluid has had its way.
vec2 flowFrom(vec2 uv) {
  if (uFlowOn < 0.5 || any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return uv;
  return texture(uFlow, uv).xy;
}

// The painted name, carried by the flow, with brushed edges (as the SVG name's
// filter: a soft two-octave waver plus a fine grain, in design px).
vec4 paintedName(vec2 p) {
  vec2 uv = boxUv(p);
  if (uv.x < -0.05 || uv.x > 1.05 || uv.y < -0.1 || uv.y > 1.1) return vec4(0.0);
  uv = flowFrom(uv);
  vec2 d = uv * DESIGN_BOX;
  vec2 waver = vec2(noise2(d * 0.016) + 0.5 * noise2(d * 0.032 + 9.1), noise2(d * 0.016 + 31.7) + 0.5 * noise2(d * 0.032 + 47.3)) / 1.5 - 0.5;
  vec2 grain = vec2(noise2(d * 0.11 + 7.3), noise2(d * 0.11 + 53.1)) - 0.5;
  return texture(uNamePaint, uv + (waver * 10.0 + grain * 4.0) / DESIGN_BOX);
}

// The binary name: each cell shows the digit of the cell the flow brought here,
// unless it has been knocked out (or is being retyped).
vec4 binaryName(vec2 p) {
  vec2 cell = vec2(floor(p.x / uCell.x), floor((p.y - uGridY) / uCell.y));
  vec2 centre = vec2((cell.x + 0.5) * uCell.x, uGridY + (cell.y + 0.5) * uCell.y);
  vec2 from = flowFrom(boxUv(centre)) * uBox.zw + uBox.xy;
  ivec2 src = ivec2(floor((from.x - uSeam) / uCell.x) - uGridInfo.x, floor((from.y - uGridY) / uCell.y));
  if (src.x < 0 || src.y < 0 || src.x >= int(uGridInfo.y) || src.y >= int(uGridInfo.z)) return vec4(0.0);
  float v = texelFetch(uNameMask, src, 0).r;
  if (v < 0.2) return vec4(0.0);
  float hole = texelFetch(uNameHoles, src, 0).r;
  if (hole > 0.75) return vec4(0.0);
  float bit = v > 0.75 ? 1.0 : 0.0;
  // Being retyped: the digit flickers before it settles.
  if (hole > 0.25) bit = step(0.5, hash21(vec2(src) + floor(uTime * 24.0)));
  vec2 local = (p - vec2(cell.x * uCell.x, uGridY + cell.y * uCell.y)) * uDpr;
  float glyph = texture(uGlyphs, (vec2(bit * uGlyphSlot, 0.0) + local) / uGlyphRes).a;
  return vec4(mix(uNameBacking, uNameInk, glyph), 1.0);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); // device px, y down
  vec2 p = vec2(frag.x / uDpr - uSeam, frag.y / uDpr);
  vec4 under;
  vec4 name = vec4(0.0);
  if (p.x < curveAt(p.y)) {
    under = paint(p);
    if (uNameOn > 0.5) name = paintedName(p);
  } else {
    under = bits(p);
    if (uNameOn > 0.5) name = binaryName(p);
  }
  outColor = name + under * (1.0 - name.a);
}
`;
