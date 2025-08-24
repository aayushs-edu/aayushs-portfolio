"use client"
import React from "react";
import { Gamepad2, Play, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center gap-3 mb-4">
          <Gamepad2 className="h-8 w-8 text-green-500" />
          <h1 className="text-3xl font-bold sm:text-4xl">Game Development</h1>
        </div>
        <p className="text-white/60 max-w-2xl mb-8">
          Unity prototypes and experimental gameplay mechanics featuring AI-driven NPCs and innovative interactions.
        </p>
        
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Gamepad2 className="mx-auto h-16 w-16 text-white/20 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Game Portfolio In Development</h2>
          <p className="text-white/60 max-w-md mx-auto">
            Preparing WebGL builds and gameplay videos of my Unity projects. 
            Features include AI behavior systems, procedural generation, and unique control schemes.
          </p>
          <Button className="mt-6" disabled>
            <Play className="mr-2 h-4 w-4" />
            Play Games (Coming Soon)
          </Button>
        </Card>
      </div>
    </div>
  );
}