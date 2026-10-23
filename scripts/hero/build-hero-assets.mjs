#!/usr/bin/env node
// Builds the hero's published assets and src/components/hero/gallery.generated.json
// from src/components/hero/gallery.json. Run after scripts/hero/depth.py
// (`npm run hero:assets` runs both). Commit the outputs.
//
//   node scripts/hero/build-hero-assets.mjs            # every item
//   node scripts/hero/build-hero-assets.mjs --slug medai

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { codeToTokens } from "shiki";
import {
  AVG_COLOR_MAX_CHROMA,
  CODE_COLUMN_CHARS,
  COLOR_LONG_SIDE,
  ITEM_BYTE_BUDGET,
  MAX_ZOOM_DIVISOR,
  PAINT_WIDTH,
  POINT_BUDGETS,
  STACK_MAX_CHARS,
} from "../../src/components/hero/heroPipeline.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HERO_SRC = path.join(ROOT, "src/components/hero");
const GALLERY = path.join(HERO_SRC, "gallery.json");
const GENERATED = path.join(HERO_SRC, "gallery.generated.json");
const SNIPPETS = path.join(HERO_SRC, "code-snippets");
const MANIFEST = path.join(ROOT, "public/paintings/manifest.json");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(PUBLIC, "hero");
const DEPTH_CACHE = path.join(ROOT, "scripts/hero/.cache/depth");

const MODES = ["art", "code"];
const CODE_REQUIRED = ["slug", "title", "stack", "src", "href"];
const TUNING_KEYS = ["depthScale"];
function fail(message) {
  console.error(`build-hero-assets: ${message}`);
  process.exit(1);
}

const rel = (p) => path.relative(ROOT, p);
const exists = (p) => fs.access(p).then(() => true, () => false);

// ---------------------------------------------------------------------------
// Validation

async function loadGallery() {
  let gallery;
  try {
    gallery = JSON.parse(await fs.readFile(GALLERY, "utf8"));
  } catch (err) {
    fail(`cannot read ${rel(GALLERY)}: ${err.message}`);
  }
  if (!MODES.includes(gallery.initialMode)) {
    fail(`initialMode must be "art" or "code", got ${JSON.stringify(gallery.initialMode)}`);
  }
  const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const bySrc = new Map(manifest.items.map((item) => [item.src, item]));

  for (const mode of MODES) {
    const section = gallery[mode];
    if (!section || !Array.isArray(section.items)) fail(`"${mode}" must be an object with an "items" array`);
    if (section.items.length === 0) fail(`"${mode}.items" is empty`);
    const seen = new Set();
    for (const item of section.items) {
      if (typeof item.slug !== "string" || !/^[a-z0-9-]+$/.test(item.slug)) {
        fail(`every "${mode}" item needs a lowercase kebab-case "slug" (got ${JSON.stringify(item.slug)})`);
      }
      if (seen.has(item.slug)) fail(`duplicate slug "${item.slug}" in "${mode}.items"`);
      seen.add(item.slug);
      if (typeof item.src !== "string" || !item.src.startsWith("/")) {
        fail(`item "${item.slug}" needs a "src" path starting with "/"`);
      }
      if (!(await exists(path.join(PUBLIC, item.src)))) fail(`item "${item.slug}": file public${item.src} does not exist`);
      if (mode === "art") {
        const entry = bySrc.get(item.src);
        if (!entry) fail(`art item "${item.slug}": ${item.src} is not in public/paintings/manifest.json`);
        item.title = entry.title;
        if (entry.year !== undefined && entry.year !== null && entry.year !== "") item.year = String(entry.year);
        item.detail = item.medium ?? "Oil on canvas";
      } else {
        const missing = CODE_REQUIRED.filter((key) => typeof item[key] !== "string" || item[key].trim() === "");
        if (missing.length) fail(`code item "${item.slug}" is missing ${missing.join(", ")}`);
        if (item.stack.length > STACK_MAX_CHARS) {
          fail(`code item "${item.slug}": "stack" is ${item.stack.length} characters (max ${STACK_MAX_CHARS})`);
        }
        if (item.year !== undefined) item.year = String(item.year);
        item.detail = item.stack;
      }
      if (item.tuning !== undefined) {
        if (typeof item.tuning !== "object" || item.tuning === null) fail(`item "${item.slug}": "tuning" must be an object`);
        for (const key of Object.keys(item.tuning)) {
          if (!TUNING_KEYS.includes(key)) fail(`item "${item.slug}": unknown tuning key "${key}"`);
        }
      }
    }
    if (!seen.has(section.initial)) {
      fail(`"${mode}.initial" is ${JSON.stringify(section.initial)}, which is not a slug in "${mode}.items"`);
    }
  }
  return gallery;
}

// ---------------------------------------------------------------------------
// Colour (OKLab / OKLCH)

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function linearToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4);

/** OKLCH → linear sRGB, reducing chroma until the colour is in gamut. */
function lchToLinear(L, C, h) {
  let lo = 0;
  let hi = C;
  let rgb = oklabToLinear(L, C * Math.cos(h), C * Math.sin(h));
  if (inGamut(rgb)) return rgb;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const test = oklabToLinear(L, mid * Math.cos(h), mid * Math.sin(h));
    if (inGamut(test)) lo = mid;
    else hi = mid;
  }
  rgb = oklabToLinear(L, lo * Math.cos(h), lo * Math.sin(h));
  return rgb.map((c) => Math.min(1, Math.max(0, c)));
}

const hex = (rgbLinear) =>
  "#" + rgbLinear.map((c) => Math.round(toGamma(Math.min(1, Math.max(0, c))) * 255).toString(16).padStart(2, "0")).join("");

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// ---------------------------------------------------------------------------
// Files

const shortHash = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 8);

async function writeHashed(dir, name, buf, keep) {
  const file = `${name}.${shortHash(buf)}.webp`;
  const full = path.join(dir, file);
  if (!(await exists(full))) await fs.writeFile(full, buf);
  keep.add(file);
  return { url: `/${path.relative(PUBLIC, full).split(path.sep).join("/")}`, bytes: buf.length };
}

async function removeExcept(dir, keep) {
  for (const file of await fs.readdir(dir)) {
    if (!keep.has(file)) {
      await fs.rm(path.join(dir, file), { recursive: true, force: true });
      console.log(`  removed ${rel(path.join(dir, file))}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Per-item processing

function gridForBudget(budget, aspect, maxW, maxH) {
  let gw = Math.round(Math.sqrt(budget * aspect));
  let gh = Math.round(gw / aspect);
  if (gw > maxW || gh > maxH) {
    const s = Math.min(maxW / gw, maxH / gh);
    gw = Math.max(1, Math.floor(gw * s));
    gh = Math.max(1, Math.floor(gh * s));
  }
  return { gw, gh, count: gw * gh };
}

/** Mean colour in OKLab, chroma clamped, as hex. */
async function averageColor(sourcePath) {
  const { data, info } = await sharp(sourcePath).rotate().resize(64, 64, { fit: "inside" }).removeAlpha().toColorspace("srgb").raw().toBuffer({ resolveWithObject: true });
  let L = 0;
  let A = 0;
  let B = 0;
  const n = info.width * info.height;
  for (let i = 0; i < n; i++) {
    const [l, a, b] = linearToOklab(toLinear(data[i * 3] / 255), toLinear(data[i * 3 + 1] / 255), toLinear(data[i * 3 + 2] / 255));
    L += l;
    A += a;
    B += b;
  }
  L /= n;
  A /= n;
  B /= n;
  const C = Math.min(Math.hypot(A, B), AVG_COLOR_MAX_CHROMA);
  return hex(lchToLinear(L, C, Math.atan2(B, A)));
}

const cleanups = [];

async function processItem(mode, item) {
  const sourcePath = path.join(PUBLIC, item.src);
  const meta = await sharp(sourcePath).rotate().metadata();
  const srcW = meta.autoOrient?.width ?? meta.width;
  const srcH = meta.autoOrient?.height ?? meta.height;
  const dir = path.join(OUT, mode, item.slug);
  await fs.mkdir(dir, { recursive: true });
  const keep = new Set();
  const assets = {};
  let bytes = 0;
  const add = (key, written) => {
    assets[key] = written.url;
    bytes += written.bytes;
  };

  const colorBuf = await sharp(sourcePath)
    .rotate()
    .resize({ width: COLOR_LONG_SIDE, height: COLOR_LONG_SIDE, fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .toColorspace("srgb")
    .webp({ quality: 88 })
    .toBuffer({ resolveWithObject: true });
  const width = colorBuf.info.width;
  const height = colorBuf.info.height;
  add("color", await writeHashed(dir, "color", colorBuf.data, keep));

  if (mode === "art") {
    const paint = await sharp(sourcePath)
      .rotate()
      .resize({ width: PAINT_WIDTH, withoutEnlargement: true })
      .removeAlpha()
      .toColorspace("srgb")
      .webp({ quality: 80 })
      .toBuffer();
    add("paint", await writeHashed(dir, "paint", paint, keep));
  }

  const depthPath = path.join(DEPTH_CACHE, mode, `${item.slug}.png`);
  if (!(await exists(depthPath))) fail(`no depth map for ${mode}/${item.slug}; run python3 scripts/hero/depth.py first`);
  const depth = await sharp(depthPath).resize({ width, height, fit: "fill" }).greyscale().webp({ lossless: true }).toBuffer();
  add("depth", await writeHashed(dir, "depth", depth, keep));

  if (bytes > ITEM_BYTE_BUDGET) {
    fail(`${mode}/${item.slug} is ${(bytes / 1024).toFixed(0)} KB, over the ${(ITEM_BYTE_BUDGET / 1024).toFixed(0)} KB budget`);
  }
  // Superseded files are removed only after the whole run has succeeded.
  cleanups.push(() => removeExcept(dir, keep));

  const aspect = width / height;
  const entry = {
    title: item.title,
    ...(item.year ? { year: item.year } : {}),
    width,
    height,
    aspect: Number(aspect.toFixed(5)),
    sourceWidth: srcW,
    sourceHeight: srcH,
    avgColor: await averageColor(sourcePath),
    maxZoom: Math.round(Math.max(srcW, srcH) / MAX_ZOOM_DIVISOR),
    tiers: Object.fromEntries(Object.entries(POINT_BUDGETS).map(([tier, budget]) => [tier, gridForBudget(budget, aspect, width, height)])),
    assets,
    bytes,
  };
  console.log(
    `assets ${mode}/${item.slug}: ${width}x${height}, ${(bytes / 1024).toFixed(0)} KB, ` +
      `full ${entry.tiers.full.count.toLocaleString("en-US")} / lite ${entry.tiers.lite.count.toLocaleString("en-US")} points`,
  );
  return entry;
}

// ---------------------------------------------------------------------------
// Syntax palette: k-means (k = 6) over chroma-weighted pixels of every art item

async function syntaxPalette(artItems) {
  const samples = [];
  // Sorted so reordering gallery.json doesn't reshuffle the palette.
  const sources = [...new Set(artItems.map((item) => item.src))].sort();
  for (const src of sources) {
    const item = { src };
    const { data, info } = await sharp(path.join(PUBLIC, item.src)).rotate().resize(96, 96, { fit: "inside" }).removeAlpha().toColorspace("srgb").raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < info.width * info.height; i++) {
      const lab = linearToOklab(toLinear(data[i * 3] / 255), toLinear(data[i * 3 + 1] / 255), toLinear(data[i * 3 + 2] / 255));
      const chroma = Math.hypot(lab[1], lab[2]);
      samples.push({ lab, w: chroma * chroma + 1e-5 });
    }
  }

  // Deterministic k-means++ (seeded LCG) so reruns give the same palette.
  let seed = 1234567;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
  const pickWeighted = (weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) <= 0) return i;
    return weights.length - 1;
  };
  const K = 6;
  const centers = [samples[pickWeighted(samples.map((s) => s.w))].lab.slice()];
  while (centers.length < K) {
    const weights = samples.map((s) => s.w * Math.min(...centers.map((c) => d2(s.lab, c))));
    centers.push(samples[pickWeighted(weights)].lab.slice());
  }
  for (let iter = 0; iter < 40; iter++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const s of samples) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < K; c++) {
        const d = d2(s.lab, centers[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      const acc = sums[best];
      acc[0] += s.lab[0] * s.w;
      acc[1] += s.lab[1] * s.w;
      acc[2] += s.lab[2] * s.w;
      acc[3] += s.w;
    }
    sums.forEach((acc, c) => {
      if (acc[3] > 0) centers[c] = [acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3]];
    });
  }

  const lch = centers.map(([L, a, b]) => ({ L, C: Math.hypot(a, b), h: Math.atan2(b, a) }));
  // Lowest chroma → punctuation and plain identifiers; the rest by chroma, most vivid first.
  lch.sort((p, q) => p.C - q.C);
  const [punct, ...vivid] = lch;
  vivid.reverse();
  const roles = { kw: vivid[0], fn: vivid[1], str: vivid[2], num: vivid[3], punct };

  // Lift lightness until the colour reaches 7:1 against black (Y >= 0.30). The spec's floor
  // is 4.5:1; the code is set at ~6 CSS px, so it gets the stricter AAA ratio.
  const legible = ({ L, C, h }) => {
    let l = L;
    let rgb = lchToLinear(l, C, h);
    while (luminance(rgb) < 0.3 && l < 0.99) {
      l += 0.005;
      rgb = lchToLinear(l, C, h);
    }
    return hex(rgb);
  };
  return {
    ...Object.fromEntries(Object.entries(roles).map(([role, color]) => [role, legible(color)])),
    com: "rgb(255 255 255 / 0.55)",
  };
}

// ---------------------------------------------------------------------------
// Code snippets → compact token runs

const LANGS = { cs: "csharp", glsl: "glsl", ts: "typescript", py: "python", dart: "dart", rs: "rust", go: "go", kt: "kotlin", swift: "swift" };

function classify(scopes) {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const s = scopes[i];
    if (s.startsWith("comment")) return "com";
    if (s.startsWith("string") || s.startsWith("constant.character")) return "str";
    if (s.startsWith("constant.numeric") || s.startsWith("constant.language")) return "num";
    if (s.startsWith("keyword.operator") || s.startsWith("punctuation")) return "punct";
    if (s.startsWith("keyword") || s.startsWith("storage")) return "kw";
    if (
      s.startsWith("entity.name.function") ||
      s.startsWith("support.function") ||
      s.startsWith("entity.name.type") ||
      s.startsWith("entity.name.class") ||
      s.startsWith("support.type") ||
      s.startsWith("support.class") ||
      s.startsWith("entity.other.inherited-class")
    ) {
      return "fn";
    }
  }
  return "punct";
}

async function tokenizeSnippets() {
  const files = (await fs.readdir(SNIPPETS)).filter((f) => !f.startsWith(".")).sort();
  if (files.length === 0) fail(`no code snippets in ${rel(SNIPPETS)}`);
  const snippets = [];
  for (const file of files) {
    const ext = path.extname(file).slice(1);
    const lang = LANGS[ext];
    if (!lang) fail(`code snippet ${file}: unsupported extension ".${ext}" (add it to LANGS)`);
    const source = (await fs.readFile(path.join(SNIPPETS, file), "utf8")).replace(/\t/g, "  ").replace(/\s+$/, "");
    const { tokens } = await codeToTokens(source, { lang, theme: "github-dark", includeExplanation: true });
    const lines = tokens.map((line) => {
      const runs = [];
      for (const token of line) {
        for (const part of token.explanation ?? [{ content: token.content, scopes: [] }]) {
          const text = part.content;
          const cls = /^\s+$/.test(text) && runs.length ? runs[runs.length - 1][1] : classify(part.scopes.map((s) => s.scopeName));
          const last = runs[runs.length - 1];
          if (last && last[1] === cls) last[0] += text;
          else runs.push([text, cls]);
        }
      }
      const width = runs.reduce((n, [t]) => n + t.length, 0);
      if (width > CODE_COLUMN_CHARS) fail(`code snippet ${file}: a line is ${width} characters (max ${CODE_COLUMN_CHARS})`);
      if (runs.length) runs[runs.length - 1][0] = runs[runs.length - 1][0].replace(/\s+$/, "");
      return runs.filter(([t]) => t.length > 0);
    });
    snippets.push({ name: file, lines });
  }
  return snippets;
}

// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : undefined;
  if (args.includes("--slug") && !slugArg) fail("--slug needs a value");

  const gallery = await loadGallery();
  let previous = null;
  if (slugArg) {
    if (!MODES.some((mode) => gallery[mode].items.some((item) => item.slug === slugArg))) fail(`no gallery item has slug "${slugArg}"`);
    if (!(await exists(GENERATED))) fail(`${rel(GENERATED)} does not exist yet; run without --slug first`);
    previous = JSON.parse(await fs.readFile(GENERATED, "utf8"));
  }

  const items = {};
  for (const mode of MODES) {
    items[mode] = {};
    for (const item of gallery[mode].items) {
      const reuse = slugArg && item.slug !== slugArg ? previous.items?.[mode]?.[item.slug] : undefined;
      if (slugArg && item.slug !== slugArg && !reuse) fail(`${mode}/${item.slug} is missing from ${rel(GENERATED)}; run without --slug`);
      items[mode][item.slug] = reuse ?? (await processItem(mode, item));
    }
  }

  if (!slugArg) {
    // Drop directories for items that left gallery.json.
    for (const mode of MODES) {
      const modeDir = path.join(OUT, mode);
      if (!(await exists(modeDir))) continue;
      for (const dir of await fs.readdir(modeDir)) {
        if (!items[mode][dir]) {
          await fs.rm(path.join(modeDir, dir), { recursive: true, force: true });
          console.log(`  removed ${rel(path.join(modeDir, dir))}`);
        }
      }
    }
  }

  const palette = await syntaxPalette(gallery.art.items);
  const snippets = await tokenizeSnippets();
  const generated = {
    note: "Written by scripts/hero/build-hero-assets.mjs from gallery.json. Do not edit by hand.",
    palette,
    snippets,
    items,
  };
  await fs.writeFile(GENERATED, JSON.stringify(generated) + "\n");
  for (const cleanup of cleanups) await cleanup();
  console.log(`wrote ${rel(GENERATED)} (palette ${Object.values(palette).join(" ")}, ${snippets.length} snippets)`);
}

await main();
