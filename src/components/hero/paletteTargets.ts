// Re-sorts an image's pixels into an ordered palette field: columns by hue
// (OKLCH), lightness top to bottom inside each hue band, near-neutral pixels
// in their own band at the left end. Pure: no three.js.

const LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const INDEX_BITS = 2 ** 20;

export interface PaletteOptions {
  /** Hue columns (plus one neutral column). */
  columns?: number;
  /** Pixels below this OKLCH chroma go to the neutral column. */
  neutralChroma?: number;
}

/**
 * For each pixel of a w×h RGBA image (row 0 at the top), returns its target
 * slot in a w×h field with the same aspect: [x, y, stagger] per pixel, with
 * x and y in -0.5..0.5 (y up) and stagger in 0..1 (the target column, so the
 * palette can sweep in column by column).
 */
export function computePaletteTargets(rgba: Uint8ClampedArray, w: number, h: number, options: PaletteOptions = {}): Float32Array {
  const columns = options.columns ?? 64;
  const neutral = options.neutralChroma ?? 0.03;
  const n = w * h;
  if (n >= INDEX_BITS) throw new Error("computePaletteTargets: image too large");

  // 1. OKLCH per pixel → sort key (hue band, then lightness descending).
  const keys = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const r = LINEAR[rgba[i * 4]];
    const g = LINEAR[rgba[i * 4 + 1]];
    const b = LINEAR[rgba[i * 4 + 2]];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.sqrt(A * A + B * B);
    let band = 0;
    if (C >= neutral) {
      let hue = Math.atan2(B, A) / (2 * Math.PI);
      if (hue < 0) hue += 1;
      band = 1 + Math.min(columns - 1, Math.floor(hue * columns));
    }
    const lightness = Math.min(4095, Math.max(0, Math.round((1 - L) * 4095)));
    keys[i] = (band * 4096 + lightness) * INDEX_BITS + i;
  }
  keys.sort();

  // 2. Bands occupy consecutive cells in column-major order; inside each band
  //    cells are visited row by row so lightness runs top to bottom.
  const out = new Float32Array(n * 3);
  const cellOrder = new Int32Array(n);
  let start = 0;
  while (start < n) {
    const band = Math.floor(keys[start] / INDEX_BITS / 4096);
    let end = start + 1;
    while (end < n && Math.floor(keys[end] / INDEX_BITS / 4096) === band) end++;
    // Cells start..end-1 in column-major order: columns c0..c1.
    const c0 = Math.floor(start / h);
    const c1 = Math.floor((end - 1) / h);
    let k = 0;
    for (let row = 0; row < h; row++) {
      for (let col = c0; col <= c1; col++) {
        const cell = col * h + row;
        if (cell >= start && cell < end) cellOrder[start + k++] = cell;
      }
    }
    start = end;
  }

  for (let k = 0; k < n; k++) {
    const pixel = keys[k] % INDEX_BITS;
    const cell = cellOrder[k];
    const col = Math.floor(cell / h);
    const row = cell - col * h;
    out[pixel * 3] = (col + 0.5) / w - 0.5;
    out[pixel * 3 + 1] = 0.5 - (row + 0.5) / h;
    out[pixel * 3 + 2] = col / Math.max(1, w - 1);
  }
  return out;
}
