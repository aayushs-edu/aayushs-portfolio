"use client";

import { useEffect, useRef } from "react";
import { sized } from "@/lib/images";

/**
 * An image as pixel art: drawn down into a tiny canvas (`cols` × `rows`
 * pixels, cover-fitted), its colours cut to `levels` per channel, and shown
 * scaled up with hard edges. For the cartridges' cover art.
 */
export default function PixelArt({ src, cols, rows, levels = 6, className }: { src: string; cols: number; rows: number; levels?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;
    let live = true;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!live) return;
      const scale = Math.max(cols / img.width, rows / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, cols, rows);
      ctx.drawImage(img, (cols - w) / 2, (rows - h) / 2, w, h);
      const data = ctx.getImageData(0, 0, cols, rows);
      const step = 255 / (levels - 1);
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = Math.round(data.data[i] / step) * step;
        data.data[i + 1] = Math.round(data.data[i + 1] / step) * step;
        data.data[i + 2] = Math.round(data.data[i + 2] / step) * step;
      }
      ctx.putImageData(data, 0, 0);
    };
    img.src = sized(src, 320);
    return () => {
      live = false;
    };
  }, [src, cols, rows, levels]);

  return <canvas ref={ref} width={cols} height={rows} className={className} aria-hidden="true" />;
}
