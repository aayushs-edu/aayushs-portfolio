# Home page: the hero unzips, the work in plain sections

Replaces the 3D showcase (`2026-10-28-showcase-3d-design.md`, `2026-10-29-showcase-room-design.md`). The 3D room is in git history up to `6307a3f`.

## Intent

The user wanted something simpler than a 3D room with a moving camera, while keeping each group's presentation close to how the room showed it. Paintwise's exploded view was the part they liked most and wanted kept.

## Decisions (made with the user, 2026-11-03)

- **Drop the whole 3D scene.** The sky prototype (painted dusk and ASCII night over the room) is deleted too, not kept on a branch.
- **This round:** clear the ground, rebuild Paintwise without 3D, and show the other groups as a plain grid for now. Then design Paintings, Animation, Games and Hackathons one at a time.
- **The hero unzips like an upside-down zip** (chosen over "the page lives inside the zip" after scrolling both as prototypes). The line splits into two raw edges, with no teeth or pull.
- **Paintwise:** built with CSS 3D ("do the simplest one"). First the jug and the figure side by side, with hover to fan out the layers and a click for the masks. Then, because that was too cramped: the still lifes removed, and both exploded views side by side, coming apart as they scroll into view.
- Left to me, for stability and efficiency: commit the user's pending hero edits separately first; take three.js and R3F off the page.

## 1. The zip

**Behaviour.**
- At the top of the page the hero is closed, as before.
- The point where the halves still meet starts just under the hero's bottom edge and climbs the line as the page scrolls.
- Below that point, each half moves off the line by k₁·d + k₂·d²/h (d below the point, h the hero's height), so the halves curl away to the sides.
- The page comes up through the gap. The name, the ribbons and the bits travel with their half. "Art × Code" lifts and fades over the first third.
- After about 1.1 screens the hero is gone, and the rest of the page sits on plain dark.

**How.**
- `hero/zipper.ts` (pure) holds the maths:
  - `zipFor(scroll, layout)` and `openAt(zip, y)`;
  - `lineAt`: below the hero the line runs on along its last direction and straightens out;
  - `goneAt(layout)`: the scroll from which every row's halves are off screen;
  - `zipClipPaths`: the wall's clip-paths on the opened edges, in screen coordinates.
- `seamShader` gets `uScroll` (the hero moves up with the page) and `uZip` (apex, k₁, k₂). The old uniform `uOpen` becomes a per-row `openAt(y)`. `curveAt` runs on below the hero, matching `lineAt`.
- `SeamCanvas` reads `window.scrollY` every frame (no smoothing, so the hero stays locked to the page). On the stage it sets:
  - `--seam-left` and `--seam-right`;
  - `--scroll`, which moves the linen and dot textures and the tagline;
  - `--unzip` (0 to 1, how far to gone);
  - `data-opening`, which hides the DOM fallback name.
- On the page (`Showcase.tsx`), the hero is `position: fixed` (its stage `100lvh`), and a spacer holds its place.
  - It takes the pointer only while closed, so the name can still be played with.
  - Once gone, it is hidden and its frame loop pauses. Scrolling back up brings it back.
- Tunables: `ZIP` in `splitConfig.ts` (`start` 1.02, `climb` 0.6, `k1` 0.42, `k2` 0.9, `runOn` 160 design px, `maxSlope` 0.5).

**Tiers.**
- Full and lite get the zip.
- Static (reduced motion, no WebGL2, or a lost context via `onFail` → `demote`) gets no zip: the hero is an ordinary first section with one still frame.
- `SplitHero` now takes its tier from the page, so a demotion reaches both.

## 2. Paintwise

Revised the same day at the user's request. The first layout (the jug beside the figure, with the still lifes under it) was "too cramped", so the still lifes were removed and both of the room's exploded views are shown.

**Layout** (`showcase/paintwise/PaintwiseSection.tsx`):
- **Top:** the title, the pitch, *The story* (opens `#work/paintwise`) and *Read the build log →* (`/paintwise`) on the left; the pipeline figure on white on the right (a click opens it full size via `HandOff`).
- **Under them:** the two exploded views side by side, wider than the section (up to 1392px):
  - *The layers* on the left;
  - *What the models see* on the right.
- The two stages are the same height, each as wide as its shape needs. On narrow screens everything stacks.

**The exploded views** (`showcase/paintwise/explode.ts`, pure):
- **Each view has its own stage** (`STAGE.view`):
  - *layers*: aspect 0.6, filling 0.92. The six layers fan out right and back, seen from the right (rotateX −7°, rotateY −49°). A tag per layer, in two rows above and below the whole fan, each over its layer's middle.
  - *masks*: aspect 0.66, filling 0.88, seen at (−8°, 28°). It shows what the models see in **Childhood Toys**, the user's own still-life painting.
    - The fruit still life (the figure's example) was tried first. Built from its 167 px thumbnail, its masks were pixelated and didn't come together, so the user switched to the painting.
    - SAM 2.1 cuts the painting into pieces. Each piece is the painting itself, with a thin rim in its mask colour.
    - Coming apart, the painting fades, and each piece moves out to its Depth Anything V2 depth (spread over 0.7 canvas widths). What no piece took is the back, farthest away.
    - One tag: "SAM 2.1 × Depth Anything V2 · each object's mask, pushed out to its depth".
- **Coming apart:** each stage starts as its picture (the jug, or the painting whole over its pieces), square on and filling 0.8 of its stage. Once 45% of it is in view, it comes apart into its view. This happens once, staggered layer by layer; the tags come in after the layers land.
- **Geometry:** spacing and angles are the old room's, with metres converted to canvas widths.
- **The stages:**
  - Each is a CSS 3D scene with `perspective` and `container-type: inline-size`; one canvas width is `100cqw` before the rig's scale.
  - Each rig (turn, scale, offset) is fitted to its stage by projecting every visible corner with the browser's own maths, so nothing is measured at runtime.
  - The tags are 2D, with a dark halo for legibility.
- **Reduced motion:** no transitions; each view is simply there once it's in view.
- **Screen readers:** each stage is an image whose label describes its view (the layers view lists the layers).

## 3. The rest of the page

- `WorkList` is now grid only: Paintings, Animation, Hackathons, Games (`GROUP_ORDER` in `works.ts`), each work opening its detail view.
- `DetailPanel` is always a modal over a scrim and plays a film inline. The page doesn't scroll while it or the figure is open.
- `#work/<slug>` links still open a work. `#group/<id>` links are gone.

## 4. Removed

- **Files:** the scene, the room, the camera path, the scroll map, panels and meshes, the R3F stations and their layouts, captions, station labels, the group bar, the film player, `showcaseConfig.ts`, and their checks.
- **Dependencies:** `three`, `@react-three/fiber` and `@types/three` are no longer direct dependencies. npm still installs `three` as `@google/model-viewer`'s peer, but nothing imports it.
- **Kept:** `public/draco/`, for the Draco-compressed models, which may come back.

## 5. Not built yet

- **Sections for Paintings, Animation, Games and Hackathons:** each to be designed one at a time, as Paintwise was. Until then they are the plain grid.
- **Media made for the room, unused for now:**
  - the salon depth maps
  - the three GLB models
  - the eight storyboard stills
  - the film loops (each film's poster shows in the grid)
  - Paintwise's eight other still lifes (taken off the section at the user's request)

**Childhood Toys' media.**
- `build-assets.py` (`build_toys`) segments `public/paintings/StillLifeToys.webp` at 1280 px as Paintwise's own "unrestricted" segmenter does. That segmenter is `SAM21UnrestrictedSegmenter` in `sam2/MasterStroke.ipynb`, in the Lightning studio `lit://aayushs2008-org/vision-model/studios/masterstroke/`.
- It runs SAM 2.1 large (`facebook/sam2.1-hiera-large` via transformers, which needs `torchvision`; 0.28 matches the installed torch 2.13) in two passes:
  - whole objects: 48 points a side, IoU 0.88, stability 0.92;
  - small objects: 64 points a side plus 32 in each of four crops, IoU 0.80, stability 0.85.
- transformers' own crops are broken, so the script cuts the crops itself and drops masks cut off at an inner crop edge, as SAM does.
- Cleanup: duplicates (IoU > 0.9) are dropped, and so are parts lying more than 70% inside a kept object (unless that mask is wall- or table-sized, over 30% of the painting).
- Each pixel then goes to the most specific mask left. Up to 32 pieces of at least 0.2% are kept, and the rest is the back. A run takes about 3 minutes on the Mac's CPU.
- Each piece gets the median Depth Anything V2 depth under it.
- The output goes to `public/showcase/paintwise/toys/` and the `toys` entry of `paintwise.generated.json`.

- **Retiring the old pages** (`/paintings`, `/animation`, `/games`, `/hackathons`, `/paintwise`).

## 6. Verification

- `npm run showcase:check` covers both pure modules and the media:
  - **The zip:** closed at the top; widens downward and with scroll; gone exactly at `goneAt`; the line runs on smoothly; the clip-paths trace the line when closed and never cross when open.
  - **The exploded views:** the states' contents; in both stages every state fits, centred, at its fill, in front of the viewer; the jug is the same size in both; the tags sit on their stages.
  - **The works:** each is in a group, and slugs are unique.
- `npx tsc --noEmit` and `npm run lint` run as usual.
