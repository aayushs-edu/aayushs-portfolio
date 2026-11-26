// The Games section's backgrounds: dark natural scenes in pixel art, one small
// image each (`canopy`, a night forest from above, is the one shown; `pines`,
// rows of pines at night, is kept to switch to), a pixel per 4 CSS px, rendered here
// once so the page shows a plain background (no canvas, so no GPU layers
// under the content; see CLAUDE.md, GPU layers).
//
// Writes public/showcase/games/bg-<name>.<hash>.webp and
// src/components/showcase/games/backgrounds.generated.json. Run with
// `npm run games:backgrounds`.

import { createHash } from "node:crypto";
import { readdirSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const W = 768;
const H = 360;
const OUT_DIR = "public/showcase/games";
const JSON_OUT = "src/components/showcase/games/backgrounds.generated.json";
/** On a 1440-wide window the middle 360 map pixels show (the image is centred): keep the features there. */
const MID = W / 2;

// ---- helpers ---------------------------------------------------------------------------

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function hash2(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t) => t * t * (3 - 2 * t);
function noise1(x, seed, octaves = 4) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const i = Math.floor(x);
    const f = smooth(x - i);
    sum += amp * (hash2(i, o, seed) * (1 - f) + hash2(i + 1, o, seed) * f);
    norm += amp;
    amp *= 0.5;
    x *= 2;
  }
  return sum / norm;
}
function noise2(x, y, seed, octaves = 4) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = smooth(x - i);
    const fy = smooth(y - j);
    const s = seed + o * 101;
    const top = hash2(i, j, s) * (1 - fx) + hash2(i + 1, j, s) * fx;
    const bottom = hash2(i, j + 1, s) * (1 - fx) + hash2(i + 1, j + 1, s) * fx;
    sum += amp * (top * (1 - fy) + bottom * fy);
    norm += amp;
    amp *= 0.5;
    x *= 2;
    y *= 2;
  }
  return sum / norm;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

function canvas() {
  const px = Buffer.alloc(W * H * 3);
  const put = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
  };
  const get = (x, y) => {
    const i = (y * W + x) * 3;
    return [px[i], px[i + 1], px[i + 2]];
  };
  /** Flat bands from top to bottom, dithered where one meets the next. */
  const bands = (colors, top = 0, bottom = H) => {
    const cs = colors.map(hex);
    for (let y = top; y < bottom; y++) {
      const at = ((y - top) / (bottom - top)) * (cs.length - 1);
      const i = Math.floor(at);
      for (let x = 0; x < W; x++) put(x, y, cs[Math.min(at - i > bayer(x, y) ? i + 1 : i, cs.length - 1)]);
    }
  };
  return { px, put, get, bands };
}

// ---- night canopy: a forest from above, at night ------------------------------------

function canopy() {
  const { px, put, get } = canvas();
  const FLOOR = [hex("#060a08"), hex("#08100b")];
  const GLADE = [hex("#0a130d"), hex("#0d1810")];
  const WATER = [hex("#060d16"), hex("#08121e"), hex("#0c1a2a")];
  const CROWNS = [
    ["#0b1812", "#13281c", "#050c08"],
    ["#0c1a16", "#14291f", "#050d0a"],
    ["#0a1510", "#112418", "#040a07"],
    ["#0b1618", "#122427", "#050b0c"],
  ].map((c) => c.map(hex));
  const glade = (x, y) => noise2(x * 0.018, y * 0.018, 11, 4) > 0.64;

  // A stream winding across, from the left edge to the right.
  const streamY = (x) => H * 0.62 + (noise1(x * 0.008, 5, 3) - 0.5) * H * 0.7;
  const streamW = (x) => 3 + noise1(x * 0.03, 6, 2) * 4;
  const inStream = (x, y) => Math.abs(y - streamY(x)) < streamW(x);

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const g = glade(x, y);
      const tone = noise2(x * 0.08, y * 0.08, 3, 2) + (bayer(x, y) - 0.5) * 0.2 > 0.5 ? 1 : 0;
      put(x, y, g ? GLADE[tone] : FLOOR[tone]);
      if (inStream(x, y)) {
        const edge = streamW(x) - Math.abs(y - streamY(x));
        put(x, y, edge < 1.2 ? WATER[1] : (x * 3 + y * 7) % 23 === 0 ? WATER[2] : WATER[0]);
      }
    }

  // Crowns on a jittered grid, drawn top to bottom so the nearer ones overlap; none in glades or the stream.
  const CELL = 8;
  const trees = [];
  for (let cy = -1; cy <= H / CELL + 1; cy++)
    for (let cx = -1; cx <= W / CELL + 1; cx++) {
      const x = cx * CELL + hash2(cx, cy, 1) * CELL;
      const y = cy * CELL + hash2(cx, cy, 2) * CELL;
      if (glade(x, y) || Math.abs(y - streamY(x)) < streamW(x) + 3) continue;
      trees.push({ x, y, r: 4 + hash2(cx, cy, 3) * 5, kind: Math.floor(hash2(cx, cy, 4) * CROWNS.length), seed: cx * 131 + cy });
    }
  trees.sort((a, b) => a.y - b.y);
  for (const t of trees) {
    const [base, lit, dark] = CROWNS[t.kind];
    const r = Math.round(t.r);
    // Its shadow on the ground, down and to the right.
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) put(t.x + dx + 2, t.y + dy + 2, mix(get(Math.min(W - 1, Math.max(0, Math.round(t.x + dx + 2))), Math.min(H - 1, Math.max(0, Math.round(t.y + dy + 2)))), [0, 0, 0], 0.45));
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const d = dx * dx + dy * dy;
        // A lumpy edge: clumps of leaves.
        if (d > r * r - (hash2(Math.round(t.x + dx), Math.round(t.y + dy), t.seed) < 0.3 ? r : 0)) continue;
        const light = -(dx + dy) / (r * 1.4) + (hash2(Math.round(t.x + dx), Math.round(t.y + dy), 9) - 0.5) * 0.5;
        put(t.x + dx, t.y + dy, d > (r - 1) * (r - 1) && dx + dy > 0 ? dark : light > 0.35 + bayer(Math.round(t.x + dx), Math.round(t.y + dy)) * 0.3 ? lit : light < -0.55 ? dark : base);
      }
  }
  return px;
}

// ---- pine ridge: rows of pines into the mist, at night --------------------------------

function pines() {
  const { px, put, bands } = canvas();
  bands(["#03050a", "#04070d", "#060a12", "#090e19", "#0d1321", "#121a2b"], 0, Math.round(H * 0.42));
  bands(["#121a2b", "#121a2b"], Math.round(H * 0.42), H);

  // Stars, sparse and dim; a small moon.
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(hash2(i, 1, 21) * W);
    const y = Math.floor(hash2(i, 2, 21) * H * 0.38);
    put(x, y, hash2(i, 3, 21) > 0.85 ? hex("#3a4258") : hex("#1d2333"));
  }
  // In the empty sky between the line under the title and the cartridges, on a wide window.
  const moon = { x: MID - 40, y: 82, r: 7 };
  for (let dy = -moon.r - 3; dy <= moon.r + 3; dy++)
    for (let dx = -moon.r - 3; dx <= moon.r + 3; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= moon.r) put(moon.x + dx, moon.y + dy, d > moon.r - 1.2 ? hex("#5b6070") : (dx + 2) * (dx + 2) + (dy - 1) * (dy - 1) < 6 ? hex("#555a69") : hex("#6b7080"));
      else if (d <= moon.r + 3 && bayer(moon.x + dx, moon.y + dy) < 0.35 * (1 - (d - moon.r) / 3)) put(moon.x + dx, moon.y + dy, hex("#141b2b"));
    }

  // Far mountains.
  const far = hex("#0f1727");
  for (let x = 0; x < W; x++) {
    const top = Math.round(H * 0.38 - noise1(x * 0.006, 31, 5) * H * 0.16);
    for (let y = top; y < H; y++) put(x, y, far);
  }

  // Rows of pines, far to near: each lower, taller and darker (further off is lighter and bluer, as at night).
  const ROWS = [
    { base: 0.44, tall: [18, 34], color: "#0c1322" },
    { base: 0.57, tall: [26, 50], color: "#09101c" },
    { base: 0.72, tall: [38, 72], color: "#060b13" },
    { base: 0.9, tall: [56, 110], color: "#03060a" },
  ];
  ROWS.forEach((row, ri) => {
    const color = hex(row.color);
    const ground = (x) => Math.round(H * row.base + (noise1(x * 0.01, 40 + ri, 3) - 0.5) * 14);
    const top = new Float32Array(W).map((_, x) => ground(x));
    for (let x = -10; x < W + 10; ) {
      const tall = row.tall[0] + hash2(x, ri, 50) * (row.tall[1] - row.tall[0]);
      const half = Math.max(4, Math.round(tall * 0.26));
      // Boughs: the outline widens in tiers down the tree, each tier a sawtooth.
      const tiers = Math.max(3, Math.round(tall / 9));
      for (let dx = -half; dx <= half; dx++) {
        const i = x + dx;
        if (i < 0 || i >= W) continue;
        const out = Math.abs(dx) / (half + 1);
        // How far down the tree this column first reaches, stepping out per tier.
        const tierAt = Math.min(tiers - 1, Math.floor(out * tiers));
        const lift = Math.round(tall * (1 - (tierAt + 1) / (tiers + 0.6)) - (out * tiers - tierAt) * 3);
        top[i] = Math.min(top[i], ground(i) - Math.max(0, lift));
      }
      // The trunk's tip.
      if (x >= 0 && x < W) top[x] = Math.min(top[x], ground(x) - Math.round(tall));
      x += half + 2 + Math.floor(hash2(x, ri, 51) * half);
    }
    for (let x = 0; x < W; x++) for (let y = Math.round(top[x]); y < H; y++) put(x, y, color);
  });
  return px;
}

// ---- write ------------------------------------------------------------------------------

const SCENES = { canopy, pines };
const out = {};
for (const f of readdirSync(OUT_DIR)) if (/^bg-.*\.webp$/.test(f)) rmSync(`${OUT_DIR}/${f}`);
for (const [name, draw] of Object.entries(SCENES)) {
  const webp = await sharp(draw(), { raw: { width: W, height: H, channels: 3 } })
    .webp({ lossless: true, effort: 6 })
    .toBuffer();
  const file = `bg-${name}.${createHash("sha256").update(webp).digest("hex").slice(0, 8)}.webp`;
  writeFileSync(`${OUT_DIR}/${file}`, webp);
  out[name] = { src: `/showcase/games/${file}`, width: W, height: H, pixel: 4 };
  console.log(`${name}: ${file} (${(webp.length / 1024).toFixed(0)} KB)`);
}
writeFileSync(JSON_OUT, JSON.stringify(out, null, 2) + "\n");
