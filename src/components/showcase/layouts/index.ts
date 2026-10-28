import type { Beat } from "../scrollMap";
import type { SceneLayout } from "./types";

export { splitLayout } from "./split";

/** Every stop as a beat of scrolling (`units` viewports each), in path order. Keys: "work:<slug>". */
export function beatsFor(layout: SceneLayout, units: number): Beat[] {
  return layout.stops.map((stop) => ({ key: `work:${stop.slug}`, t: stop.t, units }));
}
