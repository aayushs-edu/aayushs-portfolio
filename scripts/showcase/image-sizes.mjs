// Smaller copies of the site's images, so each <img> can load one near the size it's shown
// (src/lib/images.ts builds its srcset). A copy sits beside its image: x.1a2b3c4d.webp →
// x.1a2b3c4d.w640.webp. Run after showcase:assets and hero:assets (they chain it), or on its own:
//   node scripts/showcase/image-sizes.mjs
// Writes src/lib/image-sizes.generated.json ({ "/url.webp": { w, sizes: [...] } }); never hand-edit it.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "../..");
const PUBLIC = path.join(ROOT, "public");
/** Where the page's <img>s come from. */
const DIRS = ["showcase", "hero", "images"];
/** The copies' widths; one is made only when it's well under the image's own width. */
const WIDTHS = [320, 640, 960, 1440];
const SMALLER = 0.8;
const QUALITY = 82;
const VARIANT = /\.w\d+\.webp$/;
/**
 * The images the page shows through responsive() or sized() (src/lib/images.ts): the paintings
 * (wall, picker, cartridge labels), Paintwise's layers, pieces and figure, the films' posters,
 * the storyboard stills and the game covers. Add a pattern when another <img> takes a srcset.
 */
const USED = [
  /^hero\/(art|code)\/[\w-]+\/color\.[0-9a-f]{8}\.webp$/,
  /^showcase\/paintings\/(held\/)?[\w-]+\.[0-9a-f]{8}\.webp$/,
  /^showcase\/paintwise\/((layers|objects|pieces)\/[\w-]+|figure)\.[0-9a-f]{8}\.webp$/,
  /^showcase\/animation\/films\/[\w-]+\.[0-9a-f]{8}\.webp$/,
  /^images\/(view\d+|[\w-]+-cover)\.webp$/,
];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const files = DIRS.flatMap((d) => walk(path.join(PUBLIC, d))).filter((f) => f.endsWith(".webp"));
const rel = (f) => path.relative(PUBLIC, f).split(path.sep).join("/");
const sources = new Set(files.filter((f) => !VARIANT.test(f) && USED.some((re) => re.test(rel(f)))));
const manifest = {};
let made = 0;
let removed = 0;

// Copies whose image is gone (or no longer takes copies) go too.
for (const f of files.filter((f) => VARIANT.test(f))) {
  if (!sources.has(f.replace(VARIANT, ".webp"))) {
    fs.unlinkSync(f);
    removed++;
  }
}

for (const file of [...sources].sort()) {
  const { width } = await sharp(file).metadata();
  const sizes = WIDTHS.filter((w) => w <= width * SMALLER);
  if (!sizes.length) continue;
  for (const w of sizes) {
    const out = file.replace(/\.webp$/, `.w${w}.webp`);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs) continue;
    await sharp(file).resize({ width: w }).webp({ quality: QUALITY }).toFile(out);
    made++;
  }
  // Copies of widths no longer wanted.
  for (const w of WIDTHS.filter((w) => !sizes.includes(w))) {
    const out = file.replace(/\.webp$/, `.w${w}.webp`);
    if (fs.existsSync(out)) {
      fs.unlinkSync(out);
      removed++;
    }
  }
  manifest["/" + rel(file)] = { w: width, sizes };
}

fs.writeFileSync(path.join(ROOT, "src/lib/image-sizes.generated.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`image-sizes: ${Object.keys(manifest).length} images, ${made} copies made, ${removed} removed`);
