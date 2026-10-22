"use client";

import type { MotionValue } from "framer-motion";
import type { RefObject } from "react";
import type { HeroLayout } from "./Hero";
import type { GalleryItem, Tier } from "./heroConfig";

export interface HeroCanvasProps {
  tier: Tier;
  item: GalleryItem;
  prefetch: GalleryItem[];
  show: boolean;
  progress: MotionValue<number>;
  layoutRef: RefObject<HeroLayout | null>;
  layoutVersion: MotionValue<number>;
  frontImageRef: RefObject<HTMLElement | null>;
  stickyRef: RefObject<HTMLDivElement | null>;
  poolRef: RefObject<HTMLDivElement | null>;
  tapRef: RefObject<{ x: number; y: number; t: number } | null>;
  onLiveChange: (live: boolean) => void;
  onContextLost: () => void;
}

export default function HeroCanvas(props: HeroCanvasProps) {
  void props;
  return null;
}
