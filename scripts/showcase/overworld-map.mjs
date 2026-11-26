// The Games section's background: an RPG overworld map seen from above,
// dimmed right down, as one small pixel-art image (a pixel per 4 CSS px,
// scaled up with hard edges). Rendered here once rather than on a canvas in
// the page: a plain background image needs no GPU layer of its own, so the
// content over it doesn't either (a canvas there made the browser lift the
// whole section into layers, and fast scrolls showed it half painted).
//
// Writes public/showcase/games/overworld.<hash>.webp and
// src/components/showcase/games/overworld.generated.json (with the water's glint sites). Run with
// `npm run games:map`.

import { createHash } from "node:crypto";
import { readdirSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";

/** Map pixels: 768 × 360 at 4 CSS px each covers 3072 × 1440 (the section is about 1350 tall at every width). */
const W = 768;
const H = 360;
const SCALE = 0.011;
const SEED = 3;
const OUT_DIR = "public/showcase/games";
const JSON_OUT = "src/components/showcase/games/overworld.generated.json";

// Colours: a cool, dark, low-chroma world (see CLAUDE.md, Games colours).
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const DEEP = hex("#091220");
const WATER = hex("#0d1a2e");
const SHALLOW = hex("#112440");
const SAND = hex("#28231b");
const GRASS = [hex("#10201a"), hex("#13261d")];
const ROCK = [hex("#181b20"), hex("#20242b")];
const TREE = { 1: hex("#183322"), 2: hex("#10231a"), 3: hex("#09150f"), 4: hex("#0b1813") };
/** The tree sprite: 1 lit, 2 mid, 3 dark rim, 4 shadow on the ground. */
const SPRITE = ["0122200", "1122220", "1222223", "2222223", "0222234", "0033344"].map((r) => [...r].map(Number));
const TREE_CELL = 6;

function hash2(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t) => t * t * (3 - 2 * t);
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

const height = (x, y) => noise2(x * SCALE, y * SCALE, SEED, 5);
const forest = (x, y) => noise2(x * SCALE * 2.2, y * SCALE * 2.2, SEED + 7, 3) > 0.56;

const px = Buffer.alloc(W * H * 3);
const put = (x, y, [r, g, b]) => {
  const i = (y * W + x) * 3;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
};

// The ground: water, shore, grass and rock by height, dithered where one meets the next.
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const e = height(x, y) + (bayer(x, y) - 0.5) * 0.018;
    put(
      x,
      y,
      e < 0.34 ? DEEP : e < 0.4 ? WATER : e < 0.44 ? SHALLOW : e < 0.465 ? SAND : e < 0.72 ? GRASS[noise2(x * 0.05, y * 0.05, SEED + 3, 2) + (bayer(x, y) - 0.5) * 0.1 > 0.5 ? 1 : 0] : ROCK[(x + y) % 5 === 0 || (x * 3 + y) % 11 === 0 ? 1 : 0],
    );
  }

// Trees: one per cell of a grid (nudged off it), on grass where the forest noise is high.
for (let cy = -1; cy <= Math.ceil(H / TREE_CELL); cy++)
  for (let cx = -1; cx <= Math.ceil(W / TREE_CELL); cx++) {
    const tx = cx * TREE_CELL + Math.floor(hash2(cx, cy, 1) * 3) - 1;
    const ty = cy * TREE_CELL + Math.floor(hash2(cx, cy, 2) * 3) - 1;
    const e = height(tx + 3, ty + 3);
    if (e < 0.48 || e > 0.7 || !forest(tx + 3, ty + 3)) continue;
    SPRITE.forEach((line, sy) =>
      line.forEach((v, sx) => {
        const x = tx + sx;
        const y = ty + sy;
        if (v && x >= 0 && x < W && y >= 0 && y < H) put(x, y, TREE[v]);
      }),
    );
  }

// Glint sites for the animation over the map (MapGlints.tsx): a loose grid, wherever it lands on water.
const glints = [];
// Four numbers each: x, y, a seed (0–99) for its timing, and its length (2 or 3 pixels).
for (let gy = 0; gy < H / 6; gy++)
  for (let gx = 0; gx < W / 6; gx++) {
    const x = gx * 6 + Math.floor(hash2(gx, gy, 4) * 4);
    const y = gy * 6 + Math.floor(hash2(gx, gy, 5) * 4);
    const len = hash2(gx, gy, 7) > 0.6 ? 3 : 2;
    if (x < W - len && y < H && height(x, y) <= 0.43 && height(x + len - 1, y) <= 0.43) glints.push(x, y, Math.floor(hash2(gx, gy, 6) * 100), len);
  }

const webp = await sharp(px, { raw: { width: W, height: H, channels: 3 } })
  .webp({ lossless: true, effort: 6 })
  .toBuffer();
const name = `overworld.${createHash("sha256").update(webp).digest("hex").slice(0, 8)}.webp`;
for (const f of readdirSync(OUT_DIR)) if (/^overworld\..*\.webp$/.test(f) && f !== name) rmSync(`${OUT_DIR}/${f}`);
writeFileSync(`${OUT_DIR}/${name}`, webp);
writeFileSync(JSON_OUT, JSON.stringify({ src: `/showcase/games/${name}`, width: W, height: H, pixel: 4, glints }) + "\n");
console.log(`overworld: ${name} (${W}×${H}, ${(webp.length / 1024).toFixed(0)} KB), ${glints.length / 4} glint sites`);
