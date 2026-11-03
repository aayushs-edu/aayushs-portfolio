# Home page: the hero unzips, the work in plain sections

Replaces the 3D showcase (`2026-10-28-showcase-3d-design.md`, `2026-10-29-showcase-room-design.md`). The 3D room is in git history up to `6307a3f`.

## Intent

The user wanted something simpler than a 3D room with a moving camera, while keeping each group's presentation close to how the room showed it. Paintwise's exploded view was the part they liked most and wanted kept.

## Decisions (made with the user, 2026-11-03)

- **Drop the whole 3D scene.** The sky prototype (painted dusk and ASCII night over the room) is deleted too, not kept on a branch.
- **This round:** clear the ground, rebuild Paintwise without 3D, and show the other groups as a plain grid for now. Then design Paintings, Animation, Games and Hackathons one at a time.
- **The hero unzips like an upside-down zip** (chosen over "the page lives inside the zip" after scrolling both as prototypes). The line splits into two raw edges, with no teeth or pull.
- **Paintwise:** the jug and the figure side by side. Hover fans out the layers; a click pushes the masks out. Built with CSS 3D ("do the simplest one").
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

**Layout** (`showcase/paintwise/PaintwiseSection.tsx`):
- **Left:** the title, the pitch, *The story* (opens `#work/paintwise`) and *Read the build log →* (`/paintwise`), with the exploded still life under them.
- **Right:** the pipeline figure on white (a click opens it full size via `HandOff`), and the eight other still lifes under it.
- On narrow screens everything stacks.

**The exploded still life** (`showcase/paintwise/explode.ts`, pure):
- **Three states:**
  - `rest`: the canvas.
  - `layers`: the six layers fan out right and back, seen from the right (rotateX −7°, rotateY −49°), with a tag on each, alternating above and below.
  - `masks`: the layers dim to 0.25 and push back, the masks layer gives way, and its 28 objects push out to their depths, seen from the left (−6°, 43°). One tag: "SAM 2.1 × Depth Anything V2".
- **Geometry:** spacing and angles are the old room's, with metres converted to canvas widths.
- **The stage:**
  - It is a CSS 3D scene: a button with `perspective` and `container-type: inline-size`.
  - One canvas width is `100cqw` before the rig's scale.
  - Each state's rig (turn, scale, offset) is fitted to the stage by projecting every visible corner with the browser's own maths, so the stage needs no measuring at runtime.
  - The tags are 2D, pinned at their projected points.
- **Interaction:**
  - **Mouse:** hover takes it apart, and a click toggles the masks.
  - **Touch and keyboard:** taps or Enter step rest → layers → masks → rest. Focus-visible shows the layers.
  - A hint under the stage says what the next step does, with separate wording for hover and touch.
- **Reduced motion:** no transitions; the states switch at once.
- **Screen readers:** the button's label names the state, and a hidden line lists the layers.

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
- **Retiring the old pages** (`/paintings`, `/animation`, `/games`, `/hackathons`, `/paintwise`).

## 6. Verification

- `npm run showcase:check` covers both pure modules and the media:
  - **The zip:** closed at the top; widens downward and with scroll; gone exactly at `goneAt`; the line runs on smoothly; the clip-paths trace the line when closed and never cross when open.
  - **The exploded view:** the states' contents; every state fits, centred, at its fill, in front of the viewer; the tags sit on the stage.
  - **The works:** each is in a group, and slugs are unique.
- `npx tsc --noEmit` and `npm run lint` run as usual.
