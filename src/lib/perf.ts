"use client";

import { useSyncExternalStore } from "react";

/**
 * The page's performance level: "full" everywhere it can keep up, "lite" on
 * machines that can't (weak GPU or CPU, little memory). In lite the heaviest
 * effects ease off (the models stop turning on their own, Earth Blaze draws
 * fewer pixels, the film grain holds still) so the page stays smooth.
 *
 * It starts from what the browser says about the machine, then watches the
 * frame rate: if frames stay slow for a couple of seconds, it drops to lite.
 * A browser that holds a steady 30 fps on purpose (Chrome's Energy Saver, a
 * covered window, a 30 Hz screen) isn't struggling, so steady frames only
 * count when they're very slow; otherwise it's dropped frames that count.
 * It only ever drops (never climbs back), so effects don't flap on and off.
 * `?perf=lite` or `?perf=full` in the URL forces one, for testing.
 */
export type PerfLevel = "full" | "lite";

/** A window struggles if its median frame is slower than VERY_SLOW_MS (under 25 fps), however
 *  steady, or slower than SLOW_MS and DROPPED times its fastest frames (it's missing its own beat). */
const VERY_SLOW_MS = 40;
const SLOW_MS = 22;
const DROPPED = 1.5;
/** Each window's length, and how many slow windows in a row drop the page to lite. */
const WINDOW_MS = 1000;
const SLOW_WINDOWS = 2;
/** The watch starts this long after load, past the work of starting up. */
const WARMUP_MS = 3000;
/** A gap longer than this is a pause (a hidden tab, a debugger), not a slow frame. */
const PAUSE_MS = 500;

let level: PerfLevel = "full";
let started = false;
const listeners = new Set<() => void>();

function set(next: PerfLevel) {
  document.documentElement.dataset.perf = next;
  if (level === next) return;
  level = next;
  listeners.forEach((fn) => fn());
}

/** Clear signs of a weak machine: software rendering, very little memory, very few cores. */
function looksWeak(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return true;
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return true;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return true;
  } catch {
    return true;
  }
  return false;
}

/** Drops to lite once SLOW_WINDOWS windows in a row struggle. */
function watch() {
  let gaps: number[] = [];
  let windowStart = 0;
  let last = 0;
  let slow = 0;
  const tick = (now: number) => {
    if (level === "lite") return;
    if (last && now - last < PAUSE_MS) gaps.push(now - last);
    else windowStart = now;
    last = now;
    if (now - windowStart >= WINDOW_MS) {
      gaps.sort((a, b) => a - b);
      const median = gaps[gaps.length >> 1] ?? 0;
      // The browser's own beat: its faster frames (a tenth of the way up).
      const beat = gaps[Math.floor(gaps.length / 10)] ?? median;
      const struggling = median > VERY_SLOW_MS || (median > SLOW_MS && median > beat * DROPPED);
      slow = struggling ? slow + 1 : 0;
      gaps = [];
      windowStart = now;
      if (slow >= SLOW_WINDOWS) return set("lite");
    }
    requestAnimationFrame(tick);
  };
  window.setTimeout(() => requestAnimationFrame(tick), WARMUP_MS);
}

/** Starts the watch (the page calls it once it mounts; the hook calls it too). */
export function startPerf() {
  if (started || typeof window === "undefined") return;
  started = true;
  const forced = new URLSearchParams(window.location.search).get("perf");
  if (forced === "lite" || forced === "full") return set(forced);
  if (looksWeak()) return set("lite");
  set("full");
  watch();
}

function subscribe(fn: () => void) {
  startPerf();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** True when the page is in lite mode (always false on the server and the first render). */
export function usePerfLite(): boolean {
  return useSyncExternalStore(subscribe, () => level === "lite", () => false);
}
