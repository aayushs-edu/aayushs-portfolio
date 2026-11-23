"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { responsive } from "@/lib/images";
import { cn } from "@/lib/utils";

interface PaintingPickerProps {
  paintings: { title: string; src: string }[];
  /** The one being painted now */
  current: number;
  onPick: (index: number) => void;
}

/**
 * The hero's painting picker, in its top right corner: a small round button
 * that opens into a row of the paintings (the one being painted ringed, its
 * name beside them). Picking one paints it next. With a mouse it opens while
 * the pointer is over it and closes a moment after it leaves; by touch or
 * keyboard its button opens and closes it. Esc, or a click anywhere else, also
 * closes it. The thumbnails load the first time it opens. While it's closed, a
 * handwritten note with an arrow points it out.
 */

/** With a mouse, it closes this long (ms) after the pointer leaves, so a slip off it doesn't shut it. */
const CLOSE_MS = 250;

export default function PaintingPicker({
  paintings,
  current,
  onPick,
}: PaintingPickerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const closeTimer = useRef(0);
  /** How the last press came: a mouse's click follows its hover, so only touch and keys toggle it */
  const pressedBy = useRef("");

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
    setOpened(true);
  };
  const hide = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(false);
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) hide();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") show();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_MS);
      }}
      onPointerDown={(event) => {
        pressedBy.current = event.pointerType;
      }}
      className="absolute top-4 right-4 z-30 flex items-center rounded-full border border-white/10 bg-black/30 p-1 text-white/75 backdrop-blur-md transition-colors duration-300 hover:border-white/20 md:top-6 md:right-6"
    >
      {/* The row opens leftward from the button (its width eased from nothing). */}
      <div
        className={cn(
          "grid transition-[grid-template-columns,opacity] duration-300 ease-out",
          open ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
        )}
        inert={!open}
      >
        {/* No padding on this one, so closed it takes no width at all and the pill stays a circle. */}
        <div className="min-w-0 overflow-hidden">
          {/* On a narrow screen the row scrolls sideways rather than running off the left edge. It
            spans the pill's full height (over its padding), so the ringed thumbnail has room. */}
          <div className="-my-1 flex h-11 max-w-[calc(100vw-5.5rem)] items-center gap-2 overflow-x-auto overflow-y-hidden px-1.5 [scrollbar-width:none]">
            <span
              className="hidden pl-1.5 text-xs whitespace-nowrap text-white/70 sm:inline"
              aria-live="polite"
            >
              {paintings[current]?.title}
            </span>
            {opened &&
              paintings.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => onPick(i)}
                  aria-label={`Paint ${p.title}`}
                  aria-pressed={i === current}
                  title={p.title}
                  className={cn(
                    "h-7 w-9 flex-none cursor-pointer overflow-hidden rounded-md sm:h-8 sm:w-11 ring-offset-1 ring-offset-black/40 transition-[opacity,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    i === current
                      ? "opacity-100 ring-2 ring-white/80"
                      : "opacity-55 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- the gallery's own pre-sized images */}
                  <img
                    src={p.src}
                    {...responsive(p.src, "48px")}
                    alt=""
                    className="h-full w-full object-cover"
                    decoding="async"
                  />
                </button>
              ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          // A mouse has already opened it by hovering; touch and keys toggle it.
          const by = pressedBy.current;
          pressedBy.current = "";
          if (by === "mouse") return show();
          if (open) hide();
          else show();
        }}
        aria-expanded={open}
        aria-label={
          open
            ? "Close the painting picker"
            : "Choose the painting in the background"
        }
        title="Choose the painting"
        className="grid size-9 flex-none cursor-pointer place-items-center rounded-full transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Palette className="size-4" strokeWidth={1.8} aria-hidden="true" />
      </button>

      {/* The note pointing it out, while it's closed: handwritten, an arrow curling up to the button. */}
      <div
        className={cn(
          "pointer-events-none absolute top-full right-3.5 mt-1 transition-opacity duration-300",
          open ? "opacity-0" : "opacity-100",
        )}
        aria-hidden="true"
      >
        <div className="flex animate-[picker-hint_0.6s_1.4s_ease-out_both] items-end gap-1 text-white/70 motion-reduce:animate-none">
          <span className="mb-[-6px] font-[family-name:var(--font-kalam)] text-[15px] whitespace-nowrap [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]">
            Choose the painting
          </span>
          <svg
            viewBox="0 0 40 36"
            className="h-9 w-10 flex-none drop-shadow-[0_1px_4px_rgb(0_0_0/0.6)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 32C18 32 30 25 32 5" />
            <path d="M27.5 9.5 32 4l4 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
