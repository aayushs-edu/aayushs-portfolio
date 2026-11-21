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
