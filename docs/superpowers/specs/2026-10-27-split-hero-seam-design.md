# Split hero: Art | Code with a living seam

Branch `hero-split` (cut from `hero-art-x-code`, which stays untouched). Preview route: `/split`. The home page keeps the gallery hero.

## Intent

A second take on the "Art x Code" hero. Instead of a gallery with an Art/Code switch, the screen is split down the middle: the left half is Art, the right half is Code, at the same time. On the centre line a fluid oozes out on a loop. Left of the line it is oil paint, right of the line it is the same fluid digitized into 0s and 1s. One thing, two renderings, split at the line. That rule applies to everything on the screen (name, wall, ooze).

Items (paintings, projects) are out of scope for this round.

## Rules carried over

No gradients, glows, particles, sparkles, spring pop-ins or "Matrix rain". The binary is set like typography on a character grid, never falling rain. The seam uses a fixed set of six saturated pigments; the name and wall keep the painting-derived palette.

## Composition

- One screen (100svh, min 420px). No scroll story. `<SplitHero />` renders at `/split`.
- The seam is the exact centre of the title composition (design x = 707), which is the centre of the screen.
- **Name and tagline** keep the gallery hero's size and layout (same `--u`), centred vertically. Left of the seam the name is painted (the gallery hero's Art rendering); right of the seam it is binary (the Code rendering). "Art x Code" is solid white with no tabs or hover previews. With no modes there is nothing to switch.
- **Binary grid**: cell = 14 × 0.6 by 14 × 1.15 design px (the binary name's grid), anchored so the seam is a cell boundary and row 0 is the top of the title box. The binary name, the ooze's bits, the right wall's dots and the code printed on the right wall all share this grid.
- **Wall**: left half is linen, right half is the dot grid. No mouse interaction (the user removed the brush and code printing, and the intro sweep).

## The line

The middle line is not a ruler: it is a fluid curve (`CURVE` in `splitConfig.ts`). Three slow waves run along it in different directions, and every attached paint ribbon pulls it toward the paint, so the line bulges where paint is drawn out and springs back when a ribbon lets go. The curve is sampled on the CPU each frame. The shader reads it (paint, bits and the wet bead all split on it), and the same samples become CSS `clip-path` polygons (`--seam-left`, `--seam-right`) for the wall and the two full copies of the name. The clipped layers sit on their own compositor layers, so the moving clip doesn't repaint the name.

## Touching the name

The name is drawn in WebGL (`nameGL.ts`, `nameRaster.ts`) so the letters themselves can move: the painted name is a texture (the same strokes and letterforms as the SVG, brushed edges added in the shader) and the binary name is a cell mask (one texel per cell, with its digit), so the switch from the DOM name is seamless. The DOM name stays as the fallback (before the textures are ready, and without WebGL) and hides via `data-gl-name`. Tunables: `TOUCH` in `splitConfig.ts`; needs the animated tiers.

- **The letters are fluid.** A small stable-fluids simulation (velocity plus pressure projection, so the flow swirls) runs over the title box while someone moves through the name. Alongside it runs a map from each point to where its paint came from: advected by the flow and relaxed back home every frame. The painted name is drawn through that map, so the paint of the actual letters swirls and smears and then flows back into shape. The binary name uses the same map, cell by cell: each cell shows the digit of the cell the flow brought there, so the binary letters rearrange in steps.
- **Bits come loose from the binary letters.** The cells under the moving cursor are knocked out of their letter (a hole in the mask) and fly off as white digits (the letters' own colour), thrown away from the cursor and carrying some of its motion, then drift away from the paint and fade. A moment later each hole is retyped (it flickers, then settles).
- **Pull the line**: press and drag on the name (a horizontal drag on touch). The line bends through the letters toward the pointer, a wide, gentle Gaussian bend (σ 380 design px), on a spring, and wobbles back on release. The bent part never goes more than 30% of the screen width from the middle, either way, not even mid-wobble (`TOUCH.reach`). Pops born while the line is bent keep their origin, so bits don't ride the bend.
- Hit-testing uses the binary grid (its cells are the letters).

## The seam

Revised after the first build: no gravity, no drips. Paint and binary float **horizontally out of the centre line**, paint to the left, binary to the right, in saturated pigments (cadmium red, orange, yellow, emerald, ultramarine, magenta).

- A thin wet bead of the name's off-white paint runs the full height (paint side only).
- 16 thin paint ribbons on the left (10 on lite), 10–18 design px thick at the leading edge. Each loops through its own cycle (10–16 s, staggered phases):
  1. **Emerge**: a bead swells out of its side of the seam.
  2. **Push**: a ribbon extrudes sideways, still attached to the seam, with a slow wave travelling out along it and gentle swells carried with the flow.
  3. **Float**: it lets go of the seam, drifts further out while its tail catches up, and thins away to nothing.
- Every cycle re-rolls height, size, colour, reach and wave. Ribbons are spread over the whole height of the line, under the name too; the letters sit on top. Ribbons on the same side merge smoothly and marble their colours; the two sides never blend across the seam.
- **Left (paint)**: each ribbon is a stroke of paint drawn out from the line: thick and wet at the root, tapering toward its tip (no bulb), and running dry there, so the paint breaks up into bristle marks (a little along its edges too). It's a flat layer of paint, rounded only at its edges, with ridges along the bristle marks that catch a light from the upper left. Brush streaks run along the stroke and travel out with the paint.
- **Right (binary)**: not shaped like the paint. Bits **pop** out of the line: 26 spots along the full height (14 on lite) each pop every 1.6–3.6 s. A pop spits a splash of short digit packets across up to 3 rows either side; packets burst out fast, brake and drift (living 3.5–7 s, so they carry about as far out as the paint strokes reach), leave white-hot and cool to the pop's pigment, flip a digit now and then, and fade at the end of the pop's life. Each pop kicks the line toward the code side for a moment (the mirror of the paint's pull). Pops are scheduled on the CPU (`writePops`), drawn in the shader (tunables: `BITS` in `splitConfig.ts`).
- Layering, back to front: wall surface and ink, seam canvas (full hero), title.

## Implementation

| File | Role |
|---|---|
| `src/app/split/page.tsx` | Preview route (noindex) |
| `src/components/hero/SplitHero.tsx` + `SplitHero.module.css` | Section, layout measurement (u, seam, grid), layering |
| `src/components/hero/SplitTitle.tsx` | Painted/binary name split at the seam, solid tagline |
| `src/components/hero/SplitWall.tsx` | Linen left, dot grid right |
| `src/components/hero/splitConfig.ts` | Tunables (`SEAM`) and shared grid math |
| `src/components/hero/seamField.ts` | Stream lifecycles on the CPU (pure), packed into uniforms |
| `src/components/hero/seamShader.ts` | GLSL: ribbon field and paint shading (left), procedural floating bits (right) |
| `src/components/hero/SeamCanvas.tsx` | WebGL2 canvas over the hero, glyph atlas, frame loop |

No existing file is edited. Shared name-rendering code is copied into `SplitTitle.tsx`; deduplicate if this hero wins.

Raw WebGL2, one full-screen triangle, no three.js. Stream state is computed on the CPU each frame (≤ 16 streams) and passed as uniform arrays; the shader culls streams per pixel by their bounds.

## Tiers and fallbacks

- **full**: 16 ribbons, DPR ≤ 1.5. **lite**: 10 ribbons, DPR 1.
- **static** with WebGL2 (reduced motion, save-data): one still frame at a fixed time. The first client render is static too, so the animation starts from that same frame.
- No WebGL2 or context lost: a CSS hairline seam.
- The loop pauses when the hero is off screen; time advances by at most 50 ms per frame, so streams never jump after a pause.

## Verification

`npx tsc --noEmit`, `npm run lint`, then Playwright at 1440×900 and 390×844: screenshots across several seconds, an fps sample, reduced-motion still frame, no console errors.
