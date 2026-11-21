import { useEffect, useRef, useState } from "react";

export type SwapPhase = "idle" | "out" | "in";

/**
 * Switching games in two beats: when `selected` changes, `phase` goes "out"
 * (the old game is put away) for `outMs`, then `shown` becomes the new one and
 * `phase` goes "in" for `inMs`, then "idle". A switch mid-way restarts it.
 */
export function useSwap(selected: number, outMs: number, inMs: number) {
  const [shown, setShown] = useState(selected);
  const [phase, setPhase] = useState<SwapPhase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (selected === shown && phase === "idle") return;
    timers.current.forEach((t) => window.clearTimeout(t));
    setPhase("out");
    timers.current = [
      window.setTimeout(() => {
        setShown(selected);
        setPhase("in");
      }, outMs),
      window.setTimeout(() => setPhase("idle"), outMs + inMs),
    ];
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // Only a new selection starts a swap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return { shown, phase };
}
