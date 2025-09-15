// src/app/page.tsx
"use client"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Trophy,
  Sparkles,
  Palette,
  Film,
  Gamepad2,
  Code,
  Users,
  Brain,
  ArrowRight,
  Eye,
  Github,
  Linkedin,
  Mail
} from "lucide-react";

// Portfolio Highlights Data
const highlights = {
  hackathons: {
    title: "ExoVision",
    subtitle: "NASA Space Apps 2024",
    description: "3D interactive star map with 2000+ exoplanets",
    badge: "Simulation",
    image: "/images/exosky-cover.png",
    color: "from-blue-500 via-purple-500 to-pink-500",
    link: "/hackathons"
  },
  games: {
    title: "REIGN OR RUIN",
    subtitle: "AI NPC Game Jam",
    description: "AI-powered villagers with dynamic decision-making",
    badge: "$50 Award Winner",
    image: "/images/reign-or-ruin-cover.png",
    color: "from-red-400 via-orange-500 to-yellow-500",
    link: "/games"
  },
  paintings: {
    title: "Snowy Cabin",
    subtitle: "Oil on Canvas",
    description: "Award-winning winter landscape painting",
    badge: "3rd Place Winner",
    image: "/paintings/SnowyCabin.JPG",
    color: "from-cyan-400 via-blue-500 to-indigo-500",
    link: "/paintings"
  },
  animation: {
    title: "Wild West Showdown",
    subtitle: "3D Animated Short Film",
    description: "Cinematic western duel with dynamic camera work and lighting",
    badge: "Maya Animation",
    image: "/images/view6.jpg",
    color: "from-purple-400 via-pink-500 to-red-500",
    link: "/animation"
  }
};

// Stats Data
const stats = [
  { icon: Trophy, value: "7+", label: "Competitions", gradient: "from-yellow-400 to-amber-500" },
  { icon: Code, value: "100K+", label: "Lines of Code", gradient: "from-green-500 to-emerald-500" },
  { icon: Palette, value: "20+", label: "Paintings", gradient: "from-purple-500 to-pink-500" },
  { icon: Users, value: "1000+", label: "Game Views", gradient: "from-blue-500 to-cyan-500" }
];

// Hero Section Component
function HeroSection() {
  const [activeWord, setActiveWord] = useState(0);
  const words = ["Creator", "Developer", "Artist", "Designer"];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative mx-auto mt-6 max-w-7xl px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/60 to-neutral-950/80 p-8 md:p-12 shadow-2xl"
      >
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/30 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur"
          >
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Open to Opportunities • AI / ML / Software Engineering
          </motion.div>

          {/* Main heading with animated word */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5"
          >
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Art × Code
              </span>
              <br />
              <span className="text-white/90">Full-Stack </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeWord}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`inline-block bg-gradient-to-r ${
                    activeWord === 0 ? "from-purple-400 to-pink-400" :
                    activeWord === 1 ? "from-blue-400 to-cyan-400" :
                    activeWord === 2 ? "from-green-400 to-emerald-400" :
                    "from-orange-400 to-red-400"
                  } bg-clip-text text-transparent`}
                >
                  {words[activeWord]}
                </motion.span>
              </AnimatePresence>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 max-w-3xl text-lg text-white/70 leading-relaxed"
          >
            I blend <span className="text-white font-medium">art mastery</span> with{" "}
            <span className="text-white font-medium">cutting-edge technology</span> to create
            immersive experiences. From an extensive collection of oil paintings and 3D worlds to AI-powered applications,
            I push creative boundaries at every intersection.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link href="#showcase">
              <Button size="lg" className="group gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Sparkles className="h-4 w-4" />
                Explore Portfolio
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button asChild size="lg" variant="secondary" className="gap-2 border border-white/20">
              <a href="/Aayush_Sharma_Resume.pdf" download>
              <Download className="h-4 w-4" />
              Download Resume
              </a>
            </Button>
            <div className="flex gap-2">
              <Button asChild size="lg" variant="ghost" className="h-11 w-11 p-0">
                <a href="https://github.com/aayushs-edu" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-11 w-11 p-0">
                <a href="https://linkedin.com/in/aayush-sharma-1420bb311" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-11 w-11 p-0">
                <a href="mailto:aayushs2008@gmail.com">
                  <Mail className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// Portfolio Showcase Section
function PortfolioShowcase() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section id="showcase" className="mx-auto mt-32 max-w-7xl px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">Featured Work</span>
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent">
            Portfolio Highlights
          </span>
        </h2>
        <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
          Explore my award-winning projects spanning art, technology, and creative innovation
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:gap-10">
        {Object.entries(highlights).map(([key, item], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.6,
              delay: index * 0.15,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            onHoverStart={() => setHoveredCard(key)}
            onHoverEnd={() => setHoveredCard(null)}
            className="group relative"
          >
            <Link href={item.link}>
              <div className="relative h-full">
                {/* Glow effect */}
                <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r ${item.color} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30`} />

                <Card className="relative h-full overflow-hidden border-0 bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-neutral-950/90 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl rounded-3xl">
                  {/* Animated background gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} transition-opacity duration-700`}
                    animate={{ opacity: hoveredCard === key ? 0.08 : 0 }}
                  />

                  {/* Glass morphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex flex-col h-full">
                    {/* Image Section with aspect ratio */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <motion.img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        animate={{
                          scale: hoveredCard === key ? 1.1 : 1,
                          filter: hoveredCard === key ? "brightness(1.1)" : "brightness(1)"
                        }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/20 to-transparent" />

                      {/* Badge positioned on image */}
                      <div className="absolute top-4 left-4">
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                        >
                          <Badge className={`bg-gradient-to-r ${item.color} text-white font-bold px-3 py-1.5 shadow-xl backdrop-blur-sm border-0`}>
                            {item.badge}
                          </Badge>
                        </motion.div>
                      </div>

                      {/* Interactive overlay */}
                      <AnimatePresence>
                        {hoveredCard === key && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                          >
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              className={`rounded-2xl bg-gradient-to-br ${item.color} p-5 shadow-2xl`}
                            >
                              <Eye className="h-8 w-8 text-white" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-8">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <h3 className="text-3xl font-bold mb-2 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 group-hover:bg-clip-text transition-all duration-300">
                          {item.title}
                        </h3>

                        <p className={`text-base font-semibold mb-4 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                          {item.subtitle}
                        </p>

                        <p className="text-white/60 text-base leading-relaxed mb-6 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <motion.div
                            className="flex items-center gap-3 text-white/80 group-hover:text-white transition-colors"
                            whileHover={{ x: 5 }}
                          >
                            <span className="text-sm font-semibold tracking-wide">Explore Project</span>
                            <motion.div
                              animate={{ x: hoveredCard === key ? 5 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ArrowRight className="h-5 w-5" />
                            </motion.div>
                          </motion.div>

                          {/* Additional visual element */}
                          <motion.div
                            className={`h-10 w-10 rounded-full bg-gradient-to-r ${item.color} opacity-20 blur-xl`}
                            animate={{
                              scale: hoveredCard === key ? [1, 1.5, 1] : 1,
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Achievement Stats
function AchievementStats() {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900/50 to-neutral-800/30 backdrop-blur-lg p-8"
      >
        <h3 className="text-2xl font-bold mb-8 text-center">Impact & Achievements</h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 text-center backdrop-blur hover:border-white/40 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20 group-hover:opacity-30 rounded-2xl transition-opacity`} />

                <motion.div
                  className={`relative mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </motion.div>

                <div className="relative">
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// Quick Navigation
function QuickNavigation() {
  const sections = [
    { title: "Oil Paintings", icon: Palette, link: "/paintings", color: "from-cyan-500 to-blue-500" },
    { title: "3D Animation", icon: Film, link: "/animation", color: "from-purple-500 to-pink-500" },
    { title: "Game Dev", icon: Gamepad2, link: "/games", color: "from-green-500 to-emerald-500" },
    { title: "Hackathons", icon: Code, link: "/hackathons", color: "from-orange-500 to-red-500" },
    { title: "MasterStroke", icon: Brain, link: "/masterstroke", color: "from-yellow-500 to-amber-500" }
  ];

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 pb-20">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-8 text-center"
      >
        <h3 className="text-2xl font-bold mb-3">Explore Full Portfolio</h3>
        <p className="text-white/60">Deep dive into each creative discipline</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Link href={section.link}>
              <Card className="group relative overflow-hidden border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 text-center backdrop-blur hover:border-white/40 transition-all duration-300 cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-20 transition-opacity`} />

                <motion.div
                  className={`relative mx-auto mb-3 h-12 w-12 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <section.icon className="h-6 w-6 text-white" />
                </motion.div>

                <h4 className="relative text-sm font-semibold text-white/90">{section.title}</h4>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Main Component
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white [color-scheme:dark] overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-950 to-transparent pointer-events-none z-10" />
      <SubtleBackground />
      <HeroSection />
      <PortfolioShowcase />
      <AchievementStats />
      <QuickNavigation />
    </div>
  );
}

// Subtle Background Component
function SubtleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl"
      />
    </div>
  );
}