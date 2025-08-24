// src/app/page.tsx
"use client"
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  ChevronRight, 
  Download, 
  Trophy, 
  Award,
  Sparkles,
  Palette,
  Film,
  Gamepad2,
  Code,
  ExternalLink
} from "lucide-react";

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      <AuroraBackground />
      
      {/* Hero Section */}
      <section className="relative mx-auto mt-10 max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/60 to-neutral-950/80 p-8 shadow-2xl">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/30 blur-3xl" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }} 
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> 
              Open to Commissions & Internships
            </div>
            
            <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Art × Code: Oil Paintings, 3D Worlds, and Playable Ideas
            </h1>
            
            <p className="mt-4 max-w-2xl text-pretty text-white/70">
              I blend fine art technique with real-time graphics and game design. 
              From award-winning oil paintings to cutting-edge game prototypes, 
              I create at the intersection of traditional and digital media.
            </p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#featured">
                <Button size="lg" className="gap-2">
                  <ChevronRight className="h-4 w-4" /> Explore my work
                </Button>
              </Link>
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <a href="/Aayush_Sharma_Resume.pdf" download>
                  <Download className="h-4 w-4" /> Download resume
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Works Section */}
      <section id="featured" className="mx-auto mt-20 max-w-7xl px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Featured Works</h2>
          <p className="mt-2 text-white/60">Highlights from each creative discipline</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Snowy Cabin - Award Winner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur">
              <div className="absolute right-3 top-3 z-10">
                <Badge className="gap-1 bg-gradient-to-r from-yellow-500/90 to-amber-500/90 text-white backdrop-blur">
                  <Trophy className="h-3 w-3" />
                  Art Contest Winner
                </Badge>
              </div>
              
              <CardHeader className="p-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src="/paintings/SnowyCabin.JPG"
                    alt="Snowy Cabin"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                  
                  {/* Award Glow Effect */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
              </CardHeader>
              
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                    3rd Place • Local Art Competition
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold">Snowy Cabin</h3>
                <p className="mt-1 text-sm text-white/70">
                  A tranquil winter landscape where a cozy cabin rests beside a frozen lake, 
                  its warm glow reflecting against the snow as the sun sets over distant mountains.
                </p>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary">Oil Painting</Badge>
                    <Badge variant="secondary">2018</Badge>
                  </div>
                  <Link href="/paintings">
                    <Button size="sm" variant="ghost" className="gap-1">
                      View Gallery <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Coming Soon Cards for other categories */}
          {[
            { 
              title: "3D Animation Reel", 
              category: "Animation", 
              icon: Film, 
              href: "/animation",
              description: "Procedural cities, character rigs, and real-time shaders",
              color: "from-purple-500/40 to-pink-500/40"
            },
            { 
              title: "Unity Game Prototypes", 
              category: "Games", 
              icon: Gamepad2, 
              href: "/games",
              description: "AI-driven NPCs and innovative gameplay mechanics",
              color: "from-green-500/40 to-emerald-500/40"
            },
            { 
              title: "Hackathon Projects", 
              category: "Hackathons", 
              icon: Code, 
              href: "/hackathons",
              description: "Award-winning solutions and rapid prototypes",
              color: "from-blue-500/40 to-cyan-500/40"
            },
            { 
              title: "MasterStroke AI", 
              category: "MasterStroke", 
              icon: Sparkles, 
              href: "/masterstroke",
              description: "AI-powered art education and feedback system",
              color: "from-orange-500/40 to-red-500/40"
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="group relative h-full overflow-hidden border-white/10 bg-white/5 backdrop-blur">
                  <CardHeader className="p-0">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-30`} />
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-16 w-16 text-white/20" />
                      </div>
                      <div className="absolute left-3 top-3">
                        <Badge className="bg-black/60 backdrop-blur">Coming Soon</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{item.description}</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="secondary">{item.category}</Badge>
                      <Link href={item.href}>
                        <Button size="sm" variant="ghost" className="gap-1">
                          Preview <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mx-auto mt-20 max-w-7xl px-4 pb-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Art Awards", value: "3+", icon: Trophy },
            { label: "Game Prototypes", value: "5+", icon: Gamepad2 },
            { label: "Paintings", value: "17+", icon: Palette },
            { label: "Hackathon Wins", value: "2", icon: Award }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur"
              >
                <Icon className="mx-auto mb-2 h-8 w-8 text-white/60" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// Aurora Background Component
function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-70 [background:radial-gradient(60%_40%_at_20%_10%,theme(colors.violet.600/.35),transparent_60%),radial-gradient(50%_30%_at_80%_0%,theme(colors.fuchsia.500/.25),transparent_60%),radial-gradient(40%_40%_at_50%_100%,theme(colors.blue.600/.3),transparent_60%)]" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  );
}