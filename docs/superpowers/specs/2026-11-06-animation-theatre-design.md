# Animation section: the theatre

Date: 2026-11-06. Status: built (a record, written after the build). Part of the home page under the hero; see `2026-11-03-home-unzip-design.md`.

## What the user asked for

- The film plays large, with a theatre atmosphere. While it plays you can handle things in the UI: the 3D models and the snapshots.
- Playback (option 3 of 3): the silent loop plays on its own while the screen is in view. Clicking the screen plays the full film in place, with sound.
- Only Wild West gets props. All the stills and models are Wild West's. For Soccer Star and Sanctuary the props step away.
- After that: "just do your best work". No prototypes; the layout and look below are my calls.

## Design

`src/components/showcase/animation/AnimationSection.tsx` (+ `.module.css`), placed after Paintings in `Showcase.tsx`. Animation left the WorkList grid.

- **The theatre:** a near-black band (`#050505`, fading into the page's `#0d0d0d` top and bottom).
- **The programme:** "Now showing", then the three films (title in Poppins 800, year in mono). It switches the film, and a switch always returns to the loop.
- **The screen:** 16:9, filling its column, but no wider than `70svh × 16/9` so it fits the view.
- **The glow:** behind the screen, a 32×18 canvas redrawn from the video every 120 ms, blown up by CSS (`blur(64px) saturate(1.5)`). It lights the band in the picture's colours like a cinema screen. The band clips it only sideways, so it fades out above and below. A cross-origin film taints the canvas, but that only blocks reading it back; it still shows.
- **The loop:** muted and looping. It plays only while the screen is ≥ 25 % in view, and never on its own with reduced motion (the poster shows instead). A "Watch with sound" pill sits on the screen; the whole screen is the button.
- **The full film:** the same slot gets a new `<video>` with the release URL, native controls and sound. The click allows audio. A ✕ returns to the loop, and so does the film's end. The house lights go down: the heading, programme and caption fade to 35 %, and the glow brightens. The props stay at full strength.
- **The rail (Wild West only):** beside the screen, `clamp(300px, 30%, 440px)` wide, with "From the making of Wild West".
  - **The stage** (16:10 on a warm spotlight) shows the picked prop:
    - A model in `<model-viewer>` (drag to turn, auto-rotate, a Sketchfab link).
    - Or a storyboard still, with its title from the /animation page and "n / 8".
  - **The picks:** 3 model thumbs, then 8 snapshot thumbs.
  - For the other films the grid column animates to 0 and the rail fades (it is also `inert`), so the screen widens.
  - Under 900 px wide, the rail sits under the screen, and is hidden for the other films.
- **The models:** `@google/model-viewer` is imported dynamically once the section is within 800 px of the view, and only while Wild West is showing. `self.ModelViewerElement.dracoDecoderLocation = "/draco/"` is set first, so Draco decodes from the site. The thumb shows until it loads. There is one WebGL context, and none at all on the page until then.
- **Types:** `types/model-viewer-react.d.ts` declares `<model-viewer>` on `React.JSX` (React 19 doesn't read the global `JSX` in `model-viewer.d.ts`).

## Not built

- No scrubbing from a still to its moment in the film (there are no timestamps for the stills).
- No props for Soccer Star or Sanctuary, by choice.
- Clicking the screen doesn't go fullscreen. The native controls' fullscreen button does that.
- Film text is still the drafts in `works.ts` (`FILM_TEXT`, `MODEL_TEXT`).

## Restyle (2026-11-21)

The user found the layout bland and "vibecoded". Behaviour is unchanged; the look and layout are new:

- **One dark house:** the whole section darkens into `#050505` (from the page's `#0d0d0d` and back), so there is no band edge, and the glow fades out on its own.
- **No mono uppercase labels:** "Now showing", "From the making of", "Models" and "Snapshots" in spaced mono are gone. The tools line is plain sans, and the subtitle is the warm `rgb(236 228 212 / 0.62)` of the sections above.
- **The programme:** the three titles sit left-aligned over the screen, at its width, in Poppins 800. They are outlined like the hero's name until picked, then filled cream, with the year small beside each one. They size to the screen with container units (`cqi`), so they share one line. On phones they are 26 px and scroll sideways.
- **The title card:** each film opens on its title over black, which fades into the picture (1.9 s). It runs when the screen first comes into view and on every switch, and is skipped with reduced motion.
- **The screen:** "Watch with sound" sits on a scrim at the foot of the picture, with a cream play disc. The exit is a lucide `X`, with no glass blur. The caption has the story on the left and the credits on the right.
- **The rail:** it is a subgrid spanning both rows, so "The making of Wild West" (a real `h3`) sits on the programme's line.
  - The models are picked by name, as outlined pills that fill when chosen (their thumbnails were unreadable dark smudges).
  - The storyboard is a numbered contact sheet ("Shot n of 8").
  - The rail's width is `--rail-open` (`clamp(300px, 29vw, 420px)`), the same for the column and its contents.

## Wild West's making, under the screen (2026-11-21)

The user's ask: keep the video centred, put the shots under it on a conveyor belt, and stand the 3D models on stumps side by side, blending into the scene. The side rail (and its stage and picks) is gone; the screen is always centred.

- **"The making of Wild West"** (h3 + one line) folds open under the caption for Wild West only (`grid-template-rows` 0fr → 1fr; `inert` otherwise).
- **The models on stumps:** each model stands in its own transparent `<model-viewer>` on a drawn SVG stump, with no box around it.
  - **Order:** the character, the saloon in the middle, then the gun. All three stumps are the same size and stand on one floor line. The user wanted the saloon model itself bigger, not its stump, so its slot is 1.8× wider (`PROP_FIT`) with the stump drawn at the same pixel size. The user then asked for the other two bigger too: every stage is as tall as the saloon's, so theirs are narrow and tall (`aspect` per prop), and they fill 1.5 of their stump.
  - **The camera fit:** `fitCamera` in `AnimationSection.tsx` computes each camera from the model's bounding box. The feet land on the stump's top: each prop's `feet` is derived from its stump width, and the stump stands 1% above the viewer's foot. The footprint fills `fill` of the stump's top: 0.8 for most, 2.9 for the saloon, which towers over its stump.
  - **Turning:** the pitch and distance are locked, so dragging only turns the model. Zoom, pan and tap are off. Each viewer fades in once fitted.
  - **Touch screens:** the viewers ignore touches, so a swipe scrolls the row (the stumps scroll sideways under 900 px), and the drag hint is hidden.
- **The storyboard on a conveyor:** the 8 shots, numbered and titled, run right to left across the whole section width (two copies, 72 s per loop), with edges faded by a mask and hairlines above and below. It pauses on hover or focus. With reduced motion it stands still and scrolls by hand.
- Three WebGL contexts once the models load (still only while Wild West shows and the section is near).

- **The field of view:** model-viewer widens its field of view in viewers narrower than the model's own shape. The two narrow ones run at about 46°, not 30°. So the fit reads back `getFieldOfView()` after a frame and refits, up to twice.
- **Loading fix:** both IntersectionObservers now read the *last* entry. A busy page can deliver the initial "out" and a fast scroll's "in" in one callback; reading the first left `near` false, and the models never loaded.
- **Text removed:** the story and credits under the screen are gone (the user's ask). The subtitle under "Animation" has no width cap, so it sits on one line wherever it fits.
- **Tighter (user: "takes up too much vertical space"):** the section went from 1986 to 1627 px at 1440×900.
  - The screen is at most `64svh` tall (was 70).
  - The stages are `STAGE_TALL` (0.66, was 0.9) of the saloon's slot width, so 335 px instead of 457, and the models keep nearly all their size.
  - The gaps are tighter, and the storyboard frames are `clamp(180px, 15vw, 240px)`.
  - The making of Wild West, with its models and storyboard, now fits in one screen.
- **A film strip (user's ask):** the shots have no labels. They run edge to edge in a dark strip (`#1b1714`), each frame carrying five sprocket holes above and below (an SVG background, one tile per fifth of the frame), so the strip loops with the frames. There are no hairlines; the edges still fade, and hover brightens a frame. The shot titles stay as alt text.
- **Title and background (user's picks, from options):**
  - **Hand-drawn title** (`HandDrawnTitle.tsx`): the user picked Flipbook, then asked for it to stay wobbly the whole time with no flipbook. It is now a line boil: a pencil outline (1.5 px) over a cream fill at 0.88, wobbled by an SVG turbulence displacement (scale 5), cycling four noise seeds at 8 fps while in view. With reduced motion it holds one drawing.
  - **Film grain & flicker** (`FilmGrain.tsx`): a 180 px noise tile jumping each frame (opacity 0.06), a faint lamp flicker at uneven moments (≤ 0.016), and a thin scratch every 2–7 s. It is sticky to the view so its layers stay screen-sized, pauses off screen, and stands still with reduced motion.
  - **Blends between sections:** the grain is masked to fade in over the section's first 320 px and out over its last 320 px, so it has no edge where Paintings and Games meet it.
- **"The Models":** the heading over the stumps reads "The Models" and is set like "My Work" (WorkDivider): Geist 200, 14–16 px, letter-spaced 0.08em, white, centred (the user had the hairlines either side removed). The user removed the note under it. model-viewer's default loading bar is replaced by an empty `slot="progress-bar"`, since each model fades in once fitted.
