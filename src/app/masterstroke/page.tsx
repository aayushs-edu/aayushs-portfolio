"use client"
import React from "react";
import { Sparkles, Brain, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MasterStrokePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold sm:text-4xl">MasterStroke AI</h1>
        </div>
        <p className="text-white/60 max-w-2xl mb-8">
          AI-powered art education platform providing real-time feedback on sketches and paintings.
        </p>
        
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Brain className="mx-auto h-16 w-16 text-white/20 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Platform Launching Soon</h2>
          <p className="text-white/60 max-w-md mx-auto">
            MasterStroke uses computer vision and machine learning to analyze artwork 
            and provide constructive feedback on composition, values, and technique.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button disabled>
              <Palette className="mr-2 h-4 w-4" />
              Try Demo (Coming Soon)
            </Button>
            <Button variant="secondary" disabled>
              Learn More
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}