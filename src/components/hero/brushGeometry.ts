// Brush-stroke geometry (pure): a stroke is a set of parallel bristles, each a
// filled outline that tapers at both ends and wobbles with noise so the edge
// reads as dry paint, not a marker. Used by the painted name (SVG) and the
// wall brush (canvas, via Path2D).

export type Vec = [number, number];

/** One bristle: perpendicular offset, width and opacity, relative to the core width. */
export interface Bristle {
  off: number;
  w: number;
  op: number;
}

/** A loaded brush: a dense core and a few lighter bristles. */
export const CORE_BRISTLES: Bristle[] = [
  { off: 0, w: 0.62, op: 1 },
  { off: -0.29, w: 0.36, op: 0.85 },
  { off: 0.29, w: 0.36, op: 0.8 },
  { off: -0.44, w: 0.16, op: 0.6 },
  { off: 0.45, w: 0.14, op: 0.5 },
];

/** The core plus thin, faint hairs at the edges: the streaky dry-brush margin. */
export const WALL_BRISTLES: Bristle[] = [
  ...CORE_BRISTLES,
  { off: -0.53, w: 0.05, op: 0.45 },
  { off: 0.55, w: 0.04, op: 0.4 },
  { off: -0.18, w: 0.06, op: 0.35 },
  { off: 0.14, w: 0.05, op: 0.3 },
  { off: -0.6, w: 0.03, op: 0.3 },
  { off: 0.62, w: 0.03, op: 0.25 },
];

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth 1D value noise in 0..1. */
function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i + seed * 57.3);
  const b = hash(i + 1 + seed * 57.3);
  return a + (b - a) * f * f * (3 - 2 * f);
}

/** Catmull-Rom resample so the outline follows the cursor smoothly. */
export function smoothPath(points: Vec[], subdivisions = 3): Vec[] {
  if (points.length < 3) return points.slice();
  const out: Vec[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/**
 * SVG path data for each bristle of a stroke. Width tapers over the first and
 * last stretch of the stroke and wobbles with per-bristle noise; outer
 * bristles start later and lift earlier, like a loaded brush.
 */
export function bristlePaths(raw: Vec[], seed: number, width: number, bristles: Bristle[] = CORE_BRISTLES): string[] {
  const pts = smoothPath(raw);
  const n = pts.length;
  if (n < 2) return bristles.map(() => "");
  const taper = width * 1.3;
  const arc = new Float32Array(n);
  for (let i = 1; i < n; i++) arc[i] = arc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const length = arc[n - 1];
  const normals: Vec[] = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });

  return bristles.map((bristle, k) => {
    const left: string[] = [];
    const right: string[] = [];
    const scale = width / 70;
    for (let i = 0; i < n; i++) {
      const s = arc[i];
      const head = Math.min(1, s / taper);
      const tail = Math.min(1, (length - s) / (taper * 0.6));
      const t = Math.min(1, (Math.sqrt(Math.max(0, head)) * Math.sqrt(Math.max(0, tail))) / (1 - Math.abs(bristle.off) * 0.5));
      const wobble = 0.72 + 0.56 * noise1(s / (23 * scale) + k * 3.1, seed + k);
      const half = bristle.w * width * 0.5 * t * wobble;
      const drift = (noise1(s / (41 * scale) + k * 7.7, seed * 3 + k) - 0.5) * width * 0.08;
      const off = bristle.off * width * (0.55 + 0.45 * t) + drift;
      const [nx, ny] = normals[i];
      const cx = pts[i][0] + nx * off;
      const cy = pts[i][1] + ny * off;
      left.push(`${f1(cx + nx * half)} ${f1(cy + ny * half)}`);
      right.push(`${f1(cx - nx * half)} ${f1(cy - ny * half)}`);
    }
    return `M${left.join("L")}L${right.reverse().join("L")}Z`;
  });
}
