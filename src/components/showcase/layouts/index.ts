import type { Beat } from "../scrollMap";
import { chaptersLayout } from "./chapters";
import { splitLayout } from "./split";
import type { LayoutFn, SceneLayout } from "./types";

export type LayoutName = "split" | "chapters";

export const LAYOUTS: Record<LayoutName, LayoutFn> = {
  split: splitLayout,
  chapters: chaptersLayout,
};

/** `?layout=chapters` picks the chapters layout; anything else is split. */
export function parseLayout(value: string | string[] | undefined): LayoutName {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "chapters" ? "chapters" : "split";
}

/** Every stop and title as a beat of scrolling, in path order. Keys: "work:<slug>", "title:<key>". */
export function beatsFor(layout: SceneLayout, units: { work: number; title: number }): Beat[] {
  return [
    ...layout.titles.map((title) => ({ key: `title:${title.key}`, t: title.t, units: units.title })),
    ...layout.stops.map((stop) => ({ key: `work:${stop.slug}`, t: stop.t, units: units.work })),
  ].sort((a, b) => a.t - b.t);
}
