import manifest from "./image-sizes.generated.json";

/**
 * The smaller copies of the site's images (scripts/showcase/image-sizes.mjs
 * makes them beside each image: x.webp → x.w640.webp), so an <img> can load
 * one near the size it's shown instead of the full image. Every image costs
 * its full pixels in memory once decoded, however small it's shown.
 */
const SIZES = manifest as Record<string, { w: number; sizes: number[] }>;

/** The copy `width` wide (or the image itself if it has none that size). */
export function sized(src: string, width: number): string {
  return SIZES[src]?.sizes.includes(width) ? src.replace(/\.webp$/, `.w${width}.webp`) : src;
}

/**
 * `srcSet` and `sizes` for an <img>: the copies and the image itself, by
 * width; `sizes` says how wide it's shown (a CSS length or media list), and
 * the browser takes the smallest that's sharp at the screen's density.
 * Empty for an image with no copies.
 */
export function responsive(src: string, sizes: string): { srcSet?: string; sizes?: string } {
  const entry = SIZES[src];
  if (!entry) return {};
  const set = [...entry.sizes.map((w) => `${sized(src, w)} ${w}w`), `${src} ${entry.w}w`].join(", ");
  return { srcSet: set, sizes };
}
