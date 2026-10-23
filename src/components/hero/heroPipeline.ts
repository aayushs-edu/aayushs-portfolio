// Constants shared by the asset script (scripts/hero/build-hero-assets.mjs,
// which imports this file directly through Node's type stripping) and the
// app (re-exported from heroConfig.ts). Keep this file free of imports and
// non-erasable TypeScript syntax.

/** Point budget per tier. The grid is sized from the budget, never from a fixed width. */
export const POINT_BUDGETS = { full: 210_000, lite: 82_000 } as const;

/** Long side of the colour texture used by WebGL (never upscaled). */
export const COLOR_LONG_SIDE = 1024;
/** Width of the letter paint layers. */
export const PAINT_WIDTH = 800;
/** Sharpness rule for the zoom act: CSS px on the long side at DPR 2. */
export const MAX_ZOOM_DIVISOR = 1.25;
/** avgColor chroma ceiling (OKLCH) so the wall tint stays a tint. */
export const AVG_COLOR_MAX_CHROMA = 0.06;
/** Byte budget per gallery item across all generated files. */
export const ITEM_BYTE_BUDGET = 650 * 1024;
/** Stack phrases are short: placard space is tight. */
export const STACK_MAX_CHARS = 40;
/** Code layer grid: columns of code laid side by side inside the title. */
export const CODE_COLUMN_CHARS = 76;
