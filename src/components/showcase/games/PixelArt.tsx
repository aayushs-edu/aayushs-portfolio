"use client";

import { useEffect, useState } from "react";
import { sized } from "@/lib/images";

/**
 * An image as pixel art: drawn down into a tiny canvas (`cols` × `rows`
 * pixels, cover-fitted), its colours cut to `levels` per channel, and shown
 * scaled up with hard edges. For the cartridges' cover art.
 *
 * The canvas is never put in the page: the result is shown as an <img>. A
 * canvas in the page is a GPU layer, and everything drawn over it becomes
 * layers too (the cartridge in the slot made the whole handheld body one,
 * which fast scrolls showed arriving as a black rectangle).
 */
export default function PixelArt({ src, cols, rows, levels = 6, className }: { src: string; cols: number; rows: number; levels?: number; className?: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let live = true;
    let made = "";
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!live) return;
      const canvas = document.createElement("canvas");
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const scale = Math.max(cols / img.width, rows / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (cols - w) / 2, (rows - h) / 2, w, h);
      const data = ctx.getImageData(0, 0, cols, rows);
      const step = 255 / (levels - 1);
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = Math.round(data.data[i] / step) * step;
        data.data[i + 1] = Math.round(data.data[i + 1] / step) * step;
        data.data[i + 2] = Math.round(data.data[i + 2] / step) * step;
      }
      ctx.putImageData(data, 0, 0);
      canvas.toBlob((blob) => {
        if (!live || !blob) return;
        made = URL.createObjectURL(blob);
        setUrl(made);
      });
    };
    img.src = sized(src, 320);
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [src, cols, rows, levels]);

  // eslint-disable-next-line @next/next/no-img-element -- a blob made here, not a file to optimise
  return url ? <img src={url} width={cols} height={rows} className={className} alt="" aria-hidden="true" /> : <span className={className} aria-hidden="true" />;
}
