// src/app/page.tsx
"use client"
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Github,
  Linkedin,
  Mail,
  Sparkles
} from "lucide-react";

// Hero Section Component with Portrait and Role Lines
function HeroSection() {
  const roles = [
    // Left side - Art themed
    {
      title: "Painter",
      color: "#00D4FF", // Cyan
      position: "left-top",
      pathData: "M 42 37 L 35 30 L 25 30", // Shorter horizontal extension
      delay: 0.3
    },
    {
      title: "Animator",
      color: "#FF69B4", // Hot Pink
      position: "left-bottom",
      pathData: "M 42 53 L 35 60 L 25 60", // Shorter horizontal extension
      delay: 0.5
    },
    // Right side - CS themed
    {
      title: "AI Engineer",
      color: "#9945FF", // Purple
      position: "right-top",
      pathData: "M 58 37 L 65 30 L 75 30", // Shorter horizontal extension
      delay: 0.7
    },
    {
      title: "Developer",
      color: "#00FF88", // Green
      position: "right-bottom",
      pathData: "M 58 53 L 65 60 L 75 60", // Shorter horizontal extension
      delay: 0.9
    },
    // Bottom center - Combination of both
    {
      title: "Game Designer",
      color: "#FFD700", // Gold
      position: "bottom",
      pathData: "M 50 55 L 50 65", // Straight down (moved up)
      delay: 1.1
    },
  ];

  const getRolePosition = (position: string) => {
    switch(position) {
      case "left-top":
        return "top-[25%] left-[18%] md:left-[22%] lg:left-[25%]";
      case "left-bottom":
        return "top-[60.5%] left-[18%] md:left-[22%] lg:left-[25%]";
      case "right-top":
        return "top-[25%] right-[18%] md:right-[22%] lg:right-[25%]";
      case "right-bottom":
        return "top-[60.5%] right-[18%] md:right-[22%] lg:right-[25%]";
      case "bottom":
        return "bottom-[30%] left-1/2 -translate-x-1/2";
      default:
        return "";
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020202]">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/30"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: [null, -100],
                opacity: [1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto h-screen flex items-start justify-center pt-8">
        {/* Central Portrait with Roles */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Large Name Text - In Front */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute top-[2%] left-1/2 -translate-x-1/2"
            style={{ zIndex: 25 }}
          >
            <h1 className="text-[60px] md:text-[80px] lg:text-[100px] xl:text-[120px] 2xl:text-[140px] font-extrabold tracking-tight whitespace-nowrap"
                style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  textShadow: '0 0 40px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)',
                  fontFamily: 'var(--font-geist-sans)',
                  letterSpacing: '-0.02em'
                }}>
              Aayush Sharma
            </h1>
          </motion.div>

          {/* Portrait Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring", stiffness: 100 }}
            className="relative z-10 -mt-12 md:-mt-16 lg:-mt-20"
          >
            <img
              src="/images/portrait.PNG"
              alt="Aayush Sharma"
              className="w-[825px] h-[825px] md:w-[900px] md:h-[900px] lg:w-[1050px] lg:h-[1050px] xl:w-[1125px] xl:h-[1125px] 2xl:w-[1275px] 2xl:h-[1275px] object-contain"
            />
          </motion.div>

          {/* Animated connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 20 }}>
            {roles.map((role, index) => (
              <g key={role.title}>
                {/* Glow effect for path */}
                <motion.path
                  d={role.pathData}
                  stroke="white"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.2"
                  filter="blur(2px)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.2 }}
                  transition={{ duration: 1.5, delay: role.delay }}
                />
                {/* Main path */}
                <motion.path
                  d={role.pathData}
                  stroke="white"
                  strokeWidth="0.3"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ duration: 1.5, delay: role.delay }}
                />
                {/* Animated dot along the path */}
                <motion.circle
                  r="0.5"
                  fill="white"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: role.delay + 1.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${role.delay + 1.5}s`}
                  >
                    <mpath href={`#path-anim-${index}`} />
                  </animateMotion>
                </motion.circle>
                {/* Hidden path for dot animation */}
                <path
                  id={`path-anim-${index}`}
                  d={role.pathData}
                  fill="none"
                  stroke="none"
                />
              </g>
            ))}
          </svg>

          {/* Role Labels */}
          {roles.map((role) => {
            const roleLinks: Record<string, string> = {
              "Painter": "/paintings",
              "Animator": "/animation",
              "AI Engineer": "/hackathons",
              "Developer": "/hackathons",
              "Game Designer": "/games"
            };

            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: role.delay, type: "spring" }}
                className={`absolute ${getRolePosition(role.position)}`}
                style={{ zIndex: 30 }}
              >
                <Link href={roleLinks[role.title] || "/"}>
                  <div className="relative group cursor-pointer">
                    <h2
                      className="text-xl md:text-2xl lg:text-3xl font-normal whitespace-nowrap transition-all duration-300 group-hover:scale-110"
                      style={{
                        color: role.color,
                        textShadow: `0 0 20px ${role.color}60, 0 0 40px ${role.color}30`,
                        fontFamily: 'var(--font-kalam)',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {role.title}
                    </h2>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Buttons - Positioned at bottom of screen */}
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -20 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ zIndex: 35 }}
        >
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="group gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
            >
              <Sparkles className="h-4 w-4" />
              Explore My Work
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <a href="/Aayush_Sharma_Resume.pdf" download>
                <Download className="h-4 w-4" />
                Download Resume
              </a>
            </Button>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 justify-center mt-6">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              <a href="https://github.com/aayushs-edu" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              <a href="https://linkedin.com/in/aayush-sharma-1420bb311" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5" />
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              <a href="mailto:aayushs2008@gmail.com">
                <Mail className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Main Component
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden">
      {/* Sections */}
      <HeroSection />

      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
      </div>
    </div>
  );
}