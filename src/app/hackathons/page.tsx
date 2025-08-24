"use client"
import React from "react";
import { Code, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HackathonsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center gap-3 mb-4">
          <Code className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold sm:text-4xl">Hackathon Projects</h1>
        </div>
        <p className="text-white/60 max-w-2xl mb-8">
          24-48 hour sprints building innovative solutions. From AI applications to creative tools.
        </p>
        
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Trophy className="mx-auto h-16 w-16 text-white/20 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project Showcase Loading</h2>
          <p className="text-white/60 max-w-md mx-auto">
            Documenting hackathon wins and innovative prototypes. 
            Including code repositories, demos, and technical writeups.
          </p>
          <Button className="mt-6" disabled>
            <Zap className="mr-2 h-4 w-4" />
            View Projects (Coming Soon)
          </Button>
        </Card>
      </div>
    </div>
  );
}
