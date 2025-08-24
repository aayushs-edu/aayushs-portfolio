"use client"
import React from "react";
import { Film, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AnimationPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center gap-3 mb-4">
          <Film className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold sm:text-4xl">Animation & 3D</h1>
        </div>
        <p className="text-white/60 max-w-2xl mb-8">
          Exploring motion through procedural generation, character animation, and real-time rendering.
        </p>
        
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Film className="mx-auto h-16 w-16 text-white/20 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Animation Reel Coming Soon</h2>
          <p className="text-white/60 max-w-md mx-auto">
            Currently compiling my best 3D animations, procedural cities, and shader experiments. 
            Check back soon for the full showcase!
          </p>
          <Button className="mt-6" disabled>
            <Play className="mr-2 h-4 w-4" />
            Watch Reel (Coming Soon)
          </Button>
        </Card>
      </div>
    </div>
  );
}