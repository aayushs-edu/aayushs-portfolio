// src/app/page.tsx
"use client"
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Download,
  Github,
  Linkedin,
  Mail,
  Sparkles,
  Palette,
  Film,
  Code,
  Gamepad2,
  ArrowRight,
  Brain,
  Eye,
  Layers,
  Box,
  Brush,
  Activity,
  Globe,
  Rocket,
  ExternalLink,
  Trophy,
  Star,
  Users
} from "lucide-react";

// Hero Section Component with Portrait and Role Lines
function HeroSection() {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roles = [
    {
      title: "Painter",
      color: "#00D4FF",
      position: "left-top",
      pathData: "M 42 37 L 38 32 L 25 32",
      delay: 0.3,
      sectionId: "painter-section",
      textAlign: "right"
    },
    {
      title: "Animator",
      color: "#FF69B4",
      position: "left-bottom",
      pathData: "M 42 53 L 38 58 L 25 58",
      delay: 0.5,
      sectionId: "animator-section",
      textAlign: "right"
    },
    {
      title: "AI Engineer",
      color: "#ff8f45ff",
      position: "right-top",
      pathData: "M 58 37 L 62 32 L 75 32",
      delay: 0.7,
      sectionId: "ai-section",
      textAlign: "left"
    },
    {
      title: "Developer",
      color: "#00FF88",
      position: "right-bottom",
      pathData: "M 58 53 L 62 58 L 75 58",
      delay: 0.9,
      sectionId: "developer-section",
      textAlign: "left"
    },
    {
      title: "Game Designer",
      color: "#FFD700",
      position: "bottom",
      pathData: "M 50 55 L 50 64",
      delay: 1.1,
      sectionId: "games-section",
      textAlign: "center"
    },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
      {/* Animated Background Effects - Reduced for performance */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {mounted && [...Array(20)].map((_, i) => {
            const randomX = Math.random() * window.innerWidth;
            const randomY = Math.random() * window.innerHeight;
            const randomScale = Math.random() * 0.5 + 0.5;
            const randomDuration = Math.random() * 3 + 2;
            const randomDelay = Math.random() * 2;

            return (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-white/30"
                initial={{
                  x: randomX,
                  y: randomY,
                  scale: randomScale,
                }}
                animate={{
                  y: [null, -100],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: randomDuration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: randomDelay,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto h-screen flex items-start justify-center pt-8">
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Large Name Text */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute top-[-5%] left-1/2 -translate-x-1/2"
            style={{ zIndex: 25 }}
          >
            <h1 className="text-[60px] md:text-[80px] lg:text-[100px] xl:text-[120px] 2xl:text-[140px] font-extrabold tracking-tight whitespace-nowrap"
                style={{
                  color: 'rgba(255, 255, 255, 0.95)',
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
            <Image
              src="/images/portrait.webp"
              alt="Aayush Sharma"
              width={1275}
              height={1275}
              priority
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
              className="w-[825px] h-[825px] md:w-[900px] md:h-[900px] lg:w-[1050px] lg:h-[1050px] xl:w-[1125px] xl:h-[1125px] 2xl:w-[1275px] 2xl:h-[1275px] object-contain"
              sizes="(max-width: 640px) 825px, (max-width: 768px) 900px, (max-width: 1024px) 1050px, (max-width: 1280px) 1125px, 1275px"
            />
          </motion.div>

          {/* Animated connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 20 }}>
            {roles.map((role, index) => {
              const isHovered = hoveredRole === role.title;
              return (
                <g key={role.title}>
                  {/* Outer glow */}
                  <motion.path
                    d={role.pathData}
                    stroke={role.color}
                    strokeWidth="3"
                    fill="none"
                    opacity={isHovered ? "0.3" : "0.1"}
                    filter="blur(6px)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: isHovered ? [0.3, 0.5, 0.3] : 0.1,
                      strokeWidth: isHovered ? [3, 4, 3] : 3
                    }}
                    transition={{
                      pathLength: { duration: 1.5, delay: role.delay, type: "spring" },
                      opacity: { duration: 2, repeat: isHovered ? Infinity : 0 },
                      strokeWidth: { duration: 2, repeat: isHovered ? Infinity : 0 }
                    }}
                  />
                  {/* Middle glow */}
                  <motion.path
                    d={role.pathData}
                    stroke={role.color}
                    strokeWidth="1.5"
                    fill="none"
                    opacity={isHovered ? "0.5" : "0.2"}
                    filter="blur(3px)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: isHovered ? 0.5 : 0.2,
                    }}
                    transition={{ duration: 1.5, delay: role.delay }}
                  />
                  {/* Main line */}
                  <motion.path
                    d={role.pathData}
                    stroke={isHovered ? role.color : "white"}
                    strokeWidth={isHovered ? "0.7" : "0.4"}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: isHovered ? 1 : 0.7,
                      stroke: isHovered ? role.color : "white",
                      strokeWidth: isHovered ? [0.7, 0.9, 0.7] : 0.4
                    }}
                    transition={{
                      pathLength: { duration: 1.5, delay: role.delay },
                      opacity: { duration: 0.3 },
                      stroke: { duration: 0.3 },
                      strokeWidth: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
                    }}
                  />
                  <path
                    id={`path-anim-${index}`}
                    d={role.pathData}
                    fill="none"
                    stroke="none"
                  />
                </g>
              );
            })}
          </svg>

          {/* Role Labels */}
          {roles.map((role) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: role.delay, type: "spring" }}
              className={`absolute ${getRolePosition(role.position)}`}
              style={{ zIndex: 30 }}
              onMouseEnter={() => setHoveredRole(role.title)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <div
                className="relative group cursor-pointer"
                onClick={() => scrollToSection(role.sectionId)}
              >
                {/* Glowing background on hover */}
                <motion.div
                  className="absolute -inset-4 rounded-2xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: hoveredRole === role.title ? 0.15 : 0,
                    scale: hoveredRole === role.title ? 1 : 0.8
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: `radial-gradient(circle, ${role.color}40 0%, transparent 70%)`,
                    filter: 'blur(10px)'
                  }}
                />

                <div className="relative">
                  <motion.h2
                    className="text-xl md:text-2xl lg:text-3xl font-medium whitespace-nowrap transition-all duration-300"
                    animate={{
                      scale: hoveredRole === role.title ? 1.15 : 1,
                      y: hoveredRole === role.title ? -3 : 0
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                      color: role.color,
                      textShadow: hoveredRole === role.title
                        ? `0 0 30px ${role.color}80, 0 0 60px ${role.color}50, 0 0 90px ${role.color}30`
                        : `0 0 20px ${role.color}60, 0 0 40px ${role.color}30`,
                      fontFamily: 'var(--font-sniglet)',
                      letterSpacing: '0.01em'
                    }}
                  >
                    {role.title}
                  </motion.h2>

                  {/* Arrow positioned absolutely next to text */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      [role.textAlign === 'right' ? 'right' : 'left']: '100%',
                      [role.textAlign === 'right' ? 'marginRight' : 'marginLeft']: '0.75rem'
                    }}
                    initial={{ opacity: 0, x: role.textAlign === 'right' ? 10 : -10 }}
                    animate={{
                      opacity: hoveredRole === role.title ? 1 : 0,
                      x: hoveredRole === role.title
                        ? (role.textAlign === 'right' ? [0, -5, 0] : [0, 5, 0])
                        : (role.textAlign === 'right' ? 10 : -10),
                    }}
                    transition={{
                      opacity: { duration: 0.3 },
                      x: {
                        duration: 1,
                        repeat: hoveredRole === role.title ? Infinity : 0,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: hoveredRole === role.title ? [0, 5, -5, 0] : 0
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: hoveredRole === role.title ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      <ChevronRight
                        className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 rotate-90"
                        style={{
                          color: role.color,
                          filter: `drop-shadow(0 0 12px ${role.color})`
                        }}
                      />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Ripple effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: hoveredRole === role.title ? [0, 2] : 0,
                    opacity: hoveredRole === role.title ? [0.3, 0] : 0
                  }}
                  transition={{
                    duration: 1,
                    repeat: hoveredRole === role.title ? Infinity : 0,
                    repeatDelay: 0.5
                  }}
                  style={{
                    border: `2px solid ${role.color}`,
                    boxShadow: `0 0 20px ${role.color}`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Buttons */}
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
              onClick={() => scrollToSection('painter-section')}
              className="group gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 cursor-pointer"
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

// Painter Section - Left aligned
function PainterSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [heldImageIndex, setHeldImageIndex] = useState(0);

  const works = [
    { src: "/paintings/SeaTurtle.webp", title: "Snorkeling Hawaii", year: "2023" },
    { src: "/paintings/StillLifeToys.webp", title: "Childhood Toys", year: "2024" },
    { src: "/paintings/SnowyCabin.webp", title: "Snowy Cabin", year: "2024" }
  ];

  const heldImages = [
    "/paintings/Covid_2.webp",
    "/paintings/RedDeadRedemption_2.webp",
    "/paintings/Inhaler_2.webp",
    "/paintings/art_contest.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % works.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [works.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeldImageIndex((prev) => (prev + 1) % heldImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heldImages.length]);

  return (
    <section id="painter-section" className="relative min-h-screen flex items-center py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-[#020202] to-[#020202]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300D4FF' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Title Section - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/3"
          >
            <Palette className="h-16 w-16 mb-6" style={{ color: "#00D4FF" }} />
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white/40 block mb-2">I am a</span>
              <span className="block" style={{
                color: "#00D4FF",
                textShadow: "0 0 30px #00D4FF80, 0 0 60px #00D4FF40"
              }}>
                Painter
              </span>
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Oil paintings exploring light, color, and emotion through landscapes, portraits, and moments captured in time
            </p>
            <Link href="/paintings">
              <Button
                size="lg"
                className="text-white border-0 text-lg px-8 py-6 group"
                style={{ background: "linear-gradient(135deg, #00D4FF, #00A8CC)" }}
              >
                View All Paintings
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Gallery - Right Side */}
          <div className="lg:w-2/3 flex flex-col items-center">
            <div className="relative h-[700px] w-full flex items-center justify-center">
              {/* Held images rotating - positioned lower left, on top */}
              {heldImages.map((heldImg, i) => {
                const isHeldActive = i === heldImageIndex;
                const isHeldPrev = i === (heldImageIndex - 1 + heldImages.length) % heldImages.length;

                let heldX = -1000;
                let heldY = 0;
                let heldRotate = -15;
                let heldScale = 0.5;
                let heldOpacity = 0;
                let heldZ = 10;

                if (isHeldActive) {
                  heldX = -250;
                  heldY = 80;
                  heldRotate = -8;
                  heldScale = 0.85;
                  heldOpacity = 1;
                  heldZ = 35;
                } else if (isHeldPrev) {
                  heldX = -270;
                  heldY = 70;
                  heldRotate = -10;
                  heldScale = 0.8;
                  heldOpacity = 0.8;
                  heldZ = 32;
                }

                return (
                  <motion.div
                    key={`held-${i}`}
                    className="absolute pointer-events-none"
                    animate={{
                      x: heldX,
                      y: heldY,
                      rotate: heldRotate,
                      scale: heldScale,
                      opacity: heldOpacity,
                      zIndex: heldZ
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  >
                    <div className="relative rounded-2xl overflow-hidden border-4 border-cyan-400/60 shadow-2xl"
                         style={{
                           width: "400px",
                           height: "500px",
                           boxShadow: "0 25px 50px rgba(0, 212, 255, 0.3)"
                         }}>
                      <Image
                        src={heldImg}
                        alt={`Held painting ${i}`}
                        fill
                        sizes="400px"
                        quality={80}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                        className="object-cover"
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* Main painting works - positioned upper right */}
              {works.map((work, i) => {
                const isActive = i === activeIndex;
                const isPrev = i === (activeIndex - 1 + works.length) % works.length;
                const isNext = i === (activeIndex + 1) % works.length;

                let offsetX = -1000;
                let offsetY = 0;
                let rotation = 0;
                let scale = 0.85;
                let zIndex = 0;
                let opacity = 0;

                if (isActive) {
                  offsetX = 80;
                  offsetY = -80;
                  rotation = 5;
                  scale = 1;
                  zIndex = 30;
                  opacity = 1;
                } else if (isPrev) {
                  offsetX = 40;
                  offsetY = -60;
                  rotation = 0;
                  scale = 0.9;
                  zIndex = 20;
                  opacity = 0.7;
                } else if (isNext) {
                  offsetX = 120;
                  offsetY = -100;
                  rotation = 10;
                  scale = 0.9;
                  zIndex = 20;
                  opacity = 0.7;
                }

                return (
                  <motion.div
                    key={i}
                    className="absolute cursor-pointer"
                    animate={{ x: offsetX, y: offsetY, rotate: rotation, scale: scale, opacity: opacity, zIndex: zIndex }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={() => setActiveIndex(i)}
                    style={{
                      maxWidth: "90%",
                      maxHeight: "100%",
                    }}
                  >
                    <div className="relative rounded-3xl overflow-hidden border-4 shadow-2xl"
                         style={{
                           borderColor: isActive ? "#00D4FF" : "#00D4FF40",
                           boxShadow: isActive
                             ? "0 20px 60px rgba(0, 212, 255, 0.4), 0 0 80px rgba(0, 212, 255, 0.2)"
                             : "0 10px 30px rgba(0, 0, 0, 0.5)"
                         }}>
                      <Image
                        src={work.src}
                        alt={work.title}
                        width={800}
                        height={500}
                        sizes="(max-width: 768px) 90vw, 800px"
                        quality={85}
                        loading={i === 0 ? "eager" : "lazy"}
                        placeholder="blur"
                        blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                        className="max-h-[500px] w-auto h-auto"
                        priority={i === 0}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center gap-3 mt-8">
              {works.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === activeIndex ? "40px" : "12px",
                    height: "12px",
                    background: i === activeIndex
                      ? "linear-gradient(135deg, #00D4FF, #00A8CC)"
                      : "rgba(255, 255, 255, 0.3)"
                  }}
                  aria-label={`View ${works[i].title}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Animator Section - Epic Video Background with Right-aligned Title
function AnimatorSection() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const videos = [
    { src: "https://github.com/aayushs-edu/aayushs-portfolio/releases/download/videos-v1.0/wild-west.mp4", title: "Wild West Showdown", year: "2025", poster: "/images/view0.webp" },
    { src: "https://github.com/aayushs-edu/aayushs-portfolio/releases/download/videos-v1.0/sanctuary.mp4", title: "Sanctuary", year: "2023", poster: "/images/Sanctuary.webp" },
    { src: "https://github.com/aayushs-edu/aayushs-portfolio/releases/download/videos-v1.0/messi.mp4", title: "Messi Tribute", year: "2024", poster: "/images/Messi.webp" }
  ];

  useEffect(() => {
    // Pause all videos
    videoRefs.current.forEach((video: HTMLVideoElement | null) => {
      if (video) {
        video.pause();
      }
    });

    // Play the current video
    const currentVideoElement = videoRefs.current[currentVideo];
    if (currentVideoElement) {
      const playPromise = currentVideoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: unknown) => {
          // Browser prevented autoplay - this is expected
          console.warn("Video autoplay prevented:", err);
        });
      }
    }
  }, [currentVideo]);

  return (
    <section id="animator-section" className="relative min-h-screen flex items-stretch overflow-hidden">
      {/* Video Background - Full screen */}
      <div className="absolute inset-0">
        {videos.map((video, i) => (
          <video
            key={i}
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            src={video.src}
            poster={video.poster}
            loop
            muted
            playsInline
            preload={i === 0 ? "auto" : "none"}
            onError={(e) => {
              console.error(`Failed to load video: ${video.src}`, e);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              i === currentVideo ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* Gradient overlays for better content visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full flex">
        {/* Left Side - Video in background (visible through transparent area) */}
        <div className="flex-1 relative">
          {/* Video info overlay at bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-20 left-8 md:left-12 lg:left-16"
          >
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {videos[currentVideo].title}
              </h3>
              <p className="text-pink-300 text-lg">{videos[currentVideo].year}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-1">
                  <motion.div
                    className="w-1 h-4 bg-pink-500 rounded-full"
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-1 h-4 bg-pink-500 rounded-full"
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-1 h-4 bg-pink-500 rounded-full"
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-white/70 text-sm">Now Playing</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Title and Video Selection */}
        <div className="w-full lg:w-[500px] p-8 md:p-12 flex flex-col justify-center">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <Film className="h-16 w-16 mb-6 drop-shadow-lg" style={{ color: "#FF69B4" }} />
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white/80 block mb-2 drop-shadow-lg">I am an</span>
              <span className="block drop-shadow-lg" style={{
                color: "#FF69B4",
                textShadow: "0 0 30px #FF69B480, 0 0 60px #FF69B440, 0 4px 8px rgba(0,0,0,0.5)"
              }}>
                Animator
              </span>
            </h2>
            <p className="text-lg text-white mb-8 drop-shadow-lg">
              3D animation and dynamic cinematography using Autodesk Maya, Arnold Renderer, and Premiere Pro
            </p>
            <Link href="/animation">
              <Button
                size="lg"
                className="text-white border-0 text-lg px-8 py-6 group shadow-2xl"
                style={{ background: "linear-gradient(135deg, #FF69B4, #FF1493)" }}
              >
                View Animation Work
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Video Selection Cards */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 drop-shadow-lg">Select Animation</h3>
            {videos.map((video, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  i === currentVideo
                    ? 'ring-2 ring-pink-500 shadow-xl shadow-pink-500/30'
                    : 'ring-1 ring-white/20 hover:ring-pink-500/50'
                }`}
                onClick={() => setCurrentVideo(i)}
              >
                <div className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={video.poster}
                      alt={video.title}
                      fill
                      sizes="96px"
                      quality={70}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                      className="object-cover"
                    />
                    {i !== currentVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-pink-500/90 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
                        </div>
                      </div>
                    )}
                    {i === currentVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20">
                        <div className="flex gap-0.5">
                          <motion.div
                            className="w-0.5 h-3 bg-white rounded-full"
                            animate={{ scaleY: [1, 1.5, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          />
                          <motion.div
                            className="w-0.5 h-3 bg-white rounded-full"
                            animate={{ scaleY: [1, 1.5, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-0.5 h-3 bg-white rounded-full"
                            animate={{ scaleY: [1, 1.5, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-base drop-shadow-md">{video.title}</h4>
                    <p className="text-pink-300 text-sm drop-shadow-md">{video.year}</p>
                  </div>
                  {i === currentVideo && (
                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-lg shadow-pink-500/50" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// AI Engineer Section - Left aligned with MasterStroke progression
function AIEngineerSection() {
  return (
    <section id="ai-section" className="relative min-h-screen flex items-center py-20 px-4 overflow-hidden">
      {/* Orange themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-[#020202] to-[#020202]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff8f45' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* Title Section - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/3 lg:sticky lg:top-32"
          >
            <Brain className="h-16 w-16 mb-6" style={{ color: "#ff8f45" }} />
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white/40 block mb-2">I am an</span>
              <span className="block" style={{
                color: "#ff8f45",
                textShadow: "0 0 30px #ff8f4580, 0 0 60px #ff8f4540"
              }}>
                AI Engineer
              </span>
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Building intelligent systems with computer vision, deep learning, and natural language processing
            </p>
            <Link href="/hackathons">
              <Button
                size="lg"
                className="text-white border-0 text-lg px-8 py-6 group"
                style={{ background: "linear-gradient(135deg, #ff8f45, #ff6b35)" }}
              >
                View All AI Projects
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Content - Right Side */}
          <div className="lg:w-2/3 space-y-16">
            {/* MasterStroke Project */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-8">
                <Link href="/masterstroke">
                  <h3 className="text-4xl font-bold mb-4 text-white hover:text-orange-400 transition-colors cursor-pointer inline-block">
                    MasterStroke AI
                  </h3>
                </Link>
                <p className="text-white/70 text-lg mb-6">
                  AI-powered art teacher that understands artistic process through step-by-step progression analysis
                </p>
              </div>

              {/* Progression Display */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-orange-500/5 rounded-2xl blur-2xl" />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
                  {[
                    {
                      title: "Original",
                      subtitle: "Your Artwork",
                      image: "/images/masterstroke-1.webp",
                      icon: Palette,
                      color: "from-blue-500 to-cyan-500"
                    },
                    {
                      title: "Segmentation",
                      subtitle: "SAM2.1",
                      image: "/images/masterstroke-2.webp",
                      icon: Eye,
                      color: "from-green-500 to-emerald-500"
                    },
                    {
                      title: "Block-in",
                      subtitle: "Value Shapes",
                      image: "/images/masterstroke-3.webp",
                      icon: Layers,
                      color: "from-purple-500 to-pink-500"
                    },
                    {
                      title: "Edges",
                      subtitle: "PidiNet",
                      image: "/images/masterstroke-4.webp",
                      icon: Box,
                      color: "from-orange-500 to-red-500"
                    },
                    {
                      title: "Sketch",
                      subtitle: "Foundation",
                      image: "/images/masterstroke-5.webp",
                      icon: Brush,
                      color: "from-yellow-500 to-amber-500"
                    }
                  ].map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: i * 0.1,
                          duration: 0.6
                        }}
                        className="relative group"
                      >
                        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${step.color} opacity-0 blur-lg transition-all duration-500 group-hover:opacity-40`} />

                        <div className="relative bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10">
                          <div className="absolute top-2 right-2 z-10">
                            <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${step.color} p-1 shadow-lg`}>
                              <Icon className="h-full w-full text-white" />
                            </div>
                          </div>

                          <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
                            <Image
                              src={step.image}
                              alt={step.title}
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              quality={80}
                              loading="lazy"
                              placeholder="blur"
                              blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
                          </div>

                          <div className="p-3">
                            <h4 className="text-white font-bold text-sm mb-0.5">{step.title}</h4>
                            <p className={`text-xs font-medium bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                              {step.subtitle}
                            </p>
                          </div>
                        </div>

                        {i < 4 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="absolute top-1/2 -right-2 -translate-y-1/2 z-20 hidden md:block"
                          >
                            <ChevronRight className="h-4 w-4 text-white/30" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 flex items-center justify-center gap-2 text-sm"
                >
                  <Activity className="h-4 w-4 text-green-400 animate-pulse" />
                  <span className="text-green-300 font-medium">Real-time AI Analysis & Personalized Feedback</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Additional Media Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  src: "/gifs/masterstroke-blog1-3.gif",
                  title: "Art Education",
                  description: "Teaching art the way artists learn"
                },
                {
                  src: "/images/masterstroke-blog1-6.webp",
                  title: "Research",
                  description: "Exploring integrable solutions"
                }
              ].map((media, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <div className="group relative aspect-video rounded-2xl overflow-hidden border-2"
                       style={{ borderColor: "#ff8f4540" }}>
                    <Image
                      src={media.src}
                      alt={media.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={80}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h4 className="text-white font-bold text-xl mb-1">{media.title}</h4>
                      <p className="text-orange-300 text-sm">{media.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Developer Section - Right aligned with ExoVision spotlight
function DeveloperSection() {
  return (
    <section id="developer-section" className="relative min-h-screen flex items-center py-20 px-4 overflow-hidden">
      {/* Green themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-[#020202] to-[#020202]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300FF88' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Title and ExoVision in two-column layout */}
        <div className="flex flex-col lg:flex-row-reverse items-start gap-12 mb-16">
          {/* Title Section - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/3"
          >
            <Code className="h-16 w-16 mb-6" style={{ color: "#00FF88" }} />
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white/40 block mb-2">I am a</span>
              <span className="block" style={{
                color: "#00FF88",
                textShadow: "0 0 30px #00FF8880, 0 0 60px #00FF8840"
              }}>
                Developer
              </span>
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Full-stack development with Unity, Flutter, Next.js, Python, and modern web technologies
            </p>
            <Link href="/hackathons">
              <Button
                size="lg"
                className="text-white border-0 text-lg px-8 py-6 group"
                style={{ background: "linear-gradient(135deg, #00FF88, #00CC6A)" }}
              >
                View All Projects
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* ExoVision Project - Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-2/3"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-8 w-8 text-blue-400" />
                <h3 className="text-4xl font-bold text-white">ExoVision</h3>
              </div>
              <p className="text-white/70 text-lg mb-4">
                3D interactive star map of 2000+ exoplanets from NASA&apos;s database - NASA Space Apps Challenge 2024
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Unity", "C#", "WebGL", "NASA API", "Python"].map((tech, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* ExoVision Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl" />

              <div className="relative z-10 rounded-2xl overflow-hidden border-2 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                <Image
                  src="/images/exosky.webp"
                  alt="ExoVision - Interactive 3D star map"
                  width={1200}
                  height={675}
                  sizes="(max-width: 768px) 100vw, 66vw"
                  quality={85}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                  className="w-full h-auto transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Live Demo Button */}
              <div className="mt-6">
                <a href="https://mijosexoskydemo.github.io" target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white border-0"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Launch Live Demo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Other Projects Grid - Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  src: "/images/lumina.webp",
                  title: "Lumina",
                  year: "2025",
                  description: "Social good platform - GNEC Hackathon 2025",
                  link: "/hackathons",
                  tech: ["Flutter", "Flask", "GPT-4"]
                },
                {
                  src: "/images/medai.webp",
                  title: "MedAI",
                  year: "2024",
                  description: "AI medical diagnosis assistant - GNEC Hackathon 2024",
                  link: "/hackathons",
                  tech: ["TensorFlow", "Python", "ML"]
                },
                {
                  src: "/images/stockapp.webp",
                  title: "StockApp",
                  year: "2024",
                  description: "Tool for family in India managing $1M+ portfolio",
                  link: "/hackathons",
                  tech: ["React", "Node.js", "APIs"]
                }
              ].map((project, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <Link href={project.link}>
                    <div className="group relative aspect-video rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:-translate-y-2"
                         style={{ borderColor: "#00FF8840" }}>
                      <Image
                        src={project.src}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        quality={85}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h4 className="text-white font-bold text-2xl mb-1">{project.title}</h4>
                        <p className="text-green-300 text-sm mb-3">{project.year}</p>
                        <p className="text-white/80 text-sm mb-3">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.tech.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-xs">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                           style={{
                             boxShadow: "0 20px 60px rgba(0, 255, 136, 0.4), 0 0 80px rgba(0, 255, 136, 0.2)"
                           }} />
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}

// Game Designer Section - Left aligned
function GameDesignerSection() {
  const games = [
    {
      src: "/images/bounce-back-cover.webp",
      title: "Bounce Back",
      subtitle: "Build around your past self",
      year: "2025",
      jam: "GMTK Game Jam",
      award: "Top 20%",
      category: "Platformer",
      link: "https://aayushs-edu.itch.io/bounce-back"
    },
    {
      src: "/images/reign-or-ruin-cover.webp",
      title: "Reign or Ruin",
      subtitle: "Reign benevolently or get overthrown",
      year: "2025",
      jam: "Player2 AI NPC Jam",
      award: "$50 Reward",
      category: "Strategy",
      link: "https://aayushs-edu.itch.io/reign-or-ruin"
    },
    {
      src: "/images/biscuit-bandit-cover.webp",
      title: "Biscuit Bandit",
      subtitle: "Don't get caught by your parents!",
      year: "2025",
      jam: "Brackeys Game Jam 2025.2",
      category: "Stealth",
      link: "https://aayushs-edu.itch.io/biscuit-bandit"
    },
    {
      src: "/images/murphys-rocket-cover.webp",
      title: "Murphy's Rocket",
      subtitle: "Everything that can go wrong, will go wrong",
      year: "2024",
      jam: "Brackeys Game Jam 2025.1",
      category: "Action",
      link: "https://aayushs-edu.itch.io/murphys-rocket"
    }
  ];

  const reviews = [
    // Reign Or Ruin Reviews
    { id: "r1", author: "Player2 Judge", message: "Interesting concept! I like the style, audio design, and combat design.", game: "Reign Or Ruin", rating: 4 },
    { id: "r2", author: "Player2 Judge", message: "THIS IS AWESOME! LOVE THIS! This is a great concept and I know you could get this published on steam as a full game!!!!", game: "Reign Or Ruin", rating: 5 },
    { id: "r3", author: "ToucheToucan", message: "Man they hate me, they just had a mass rebellion against me. Cool idea!", game: "Reign Or Ruin", rating: 4 },
    { id: "r4", author: "wenzhe-elefant", message: "I would give 10 for creativity, but yeah need a bit more polish", game: "Reign Or Ruin", rating: 4 },
    { id: "r5", author: "Dyrkabes", message: "I really like the visuals! Very well done, all in one thematic.", game: "Reign Or Ruin", rating: 5 },
    { id: "r6", author: "Dyrkabes", message: "The council/rebellion thing has a lot of potential, interesting, that you have to balance what AI \"thinks\" about you", game: "Reign Or Ruin", rating: 5 },
    // Bounce Back Reviews
    { id: "b1", author: "Redya Games", message: "Simple and addicting game, I love it!", game: "Bounce Back", rating: 5 },
    { id: "b2", author: "gambitono", message: "like the idea and the visuals neon!!!", game: "Bounce Back", rating: 4 },
    { id: "b3", author: "xefensor", message: "Interesting idea. Though you can just keep multiplying you score by warping back to back.", game: "Bounce Back", rating: 3 },
    { id: "b4", author: "KDeveloper", message: "Great concept but quite simple. I think it could be neat if there were more types of platforms and/or ways to gain new platforms", game: "Bounce Back", rating: 4 },
    { id: "b5", author: "ClemGames", message: "Neat concept and idea!", game: "Bounce Back", rating: 4 },
    { id: "b6", author: "cachandlerdev", message: "The music and visuals look good!", game: "Bounce Back", rating: 4 },
    { id: "b7", author: "Mat Eliot", message: "I did horrible but still enjoyed! Good game.", game: "Bounce Back", rating: 4 },
    { id: "b8", author: "AA Games", message: "Pretty fun concept, My record was 157. Good job :D", game: "Bounce Back", rating: 5 },
    { id: "b9", author: "Macientosh", message: "Cool concept. The game is fun and controls feel good for the most part.", game: "Bounce Back", rating: 5 },
    { id: "b10", author: "LEGENDBOSS123", message: "Fun game.", game: "Bounce Back", rating: 4 },
    { id: "b11", author: "NotamGames", message: "This concept is simple, but it's really good and well executed. It really made me wanna optimize my strategy!", game: "Bounce Back", rating: 5 },
    { id: "b12", author: "Bill the Ball", message: "This is a very neat game", game: "Bounce Back", rating: 4 },
    { id: "b13", author: "dogma quest", message: "The screen wrapping and upside down platforming is really cool!", game: "Bounce Back", rating: 4 },
    { id: "b14", author: "keeramel", message: "Very nice game! my high score is 285", game: "Bounce Back", rating: 5 },
    // Biscuit Bandit Reviews
    { id: "bb1", author: "Trash Pandas", message: "Really good concept, and i think it's very well polished for a 1-person week-long game.", game: "Biscuit Bandit", rating: 5 },
    { id: "bb2", author: "ollie-dickson-6262", message: "Cool idea, and fun to play, maybe could've done with a bit more of a tutorial or something but good job!", game: "Biscuit Bandit", rating: 4 },
    { id: "bb3", author: "jamesedra", message: "pretty fun game! I really liked the setting and turning off the lights", game: "Biscuit Bandit", rating: 4 },
    { id: "bb4", author: "CaseM", message: "really fun game! I liked the line so I knew where someone could see me, that was a nice detail that helped with the 2d aspect of it.", game: "Biscuit Bandit", rating: 5 },
    { id: "bb5", author: "AEPSchmitt", message: "This is really solid little stealth game! Pretty incredible difficulty balancing and level design for a game jam.", game: "Biscuit Bandit", rating: 5 },
    { id: "bb6", author: "BetterCallKrishna", message: "Didn't finished it but it was fun to play", game: "Biscuit Bandit", rating: 4 },
    { id: "bb7", author: "SamiCode Games", message: "Amazing Pixel Art, Very Fun", game: "Biscuit Bandit", rating: 5 },
    { id: "bb8", author: "Swynwraig Games", message: "Really good game! The darkness and music are a great addition, really added to the suspense!", game: "Biscuit Bandit", rating: 5 },
    { id: "bb9", author: "Karim D.", message: "Really well executed! the mechanics work great, you can really feel the pressure from the parents!", game: "Biscuit Bandit", rating: 5 },
    { id: "bb10", author: "theDwarf80", message: "oh this game is nuts great job i love the gameplay but it tis a bit dark 👍😁", game: "Biscuit Bandit", rating: 4 }
  ];

  return (
    <section id="games-section" className="relative min-h-screen flex items-center py-20 px-4 overflow-hidden">
      {/* Gold themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-950/30 via-[#020202] to-[#020202]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* Title Section - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/3"
          >
            <Gamepad2 className="h-16 w-16 mb-6" style={{ color: "#FFD700" }} />
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white/40 block mb-2">I am a</span>
              <span className="block" style={{
                color: "#FFD700",
                textShadow: "0 0 30px #FFD70080, 0 0 60px #FFD70040"
              }}>
                Game Designer
              </span>
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Unity games from time-crunched, themed game jams with innovative mechanics and engaging gameplay
            </p>
            <Link href="/games">
              <Button
                size="lg"
                className="text-white border-0 text-lg px-8 py-6 group"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
              >
                View All Games
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Games Gallery - Right Side */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((game, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            >
              <a href={game.link} target="_blank" rel="noopener noreferrer">
                <div className="group relative aspect-video rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:-translate-y-2"
                     style={{ borderColor: "#FFD70040" }}>
                  <Image
                    src={game.src}
                    alt={game.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={85}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAP0lEQVR4nAE0AMv/AERERERERERERAAAAAAAAAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAA8fYMBd8zje8AAAAASUVORK5CYII="
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Award Badge */}
                  {game.award && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 rounded-full shadow-lg">
                        <Trophy className="h-4 w-4 text-white" />
                        <span className="text-white text-xs font-bold">{game.award}</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="mb-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-medium mb-3">
                        {game.category}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-2">{game.title}</h3>
                    <p className="text-white/70 text-sm mb-3">{game.subtitle}</p>
                    <div className="flex items-center gap-2 text-yellow-300 text-sm">
                      <Sparkles className="h-4 w-4" />
                      <span>{game.jam}</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                       style={{
                         boxShadow: "0 20px 60px rgba(255, 215, 0, 0.4), 0 0 80px rgba(255, 215, 0, 0.2)"
                       }} />
                </div>
              </a>
            </motion.div>
          ))}
            </div>
          </div>
        </div>

        {/* Infinite Scrolling Reviews Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 w-full"
        >
          <h3 className="text-3xl font-bold mb-6 text-white text-center lg:text-left">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Player Reviews
            </span>
          </h3>

          {/* Infinite scrolling container */}
          <div className="relative overflow-hidden w-full -mx-4 px-4">
            <div className="flex gap-4 animate-infinite-scroll hover:pause-animation">
              {/* First set of reviews */}
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 w-80 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5 hover:border-yellow-500/40 transition-all duration-300"
                >
                  {/* Game name */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold">
                      {review.game}
                    </span>
                  </div>

                  {/* Star rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review message */}
                  <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3">
                    &ldquo;{review.message}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">{review.author}</span>
                  </div>
                </div>
              ))}

              {/* Duplicate set for infinite effect */}
              {reviews.map((review) => (
                <div
                  key={`${review.id}-duplicate`}
                  className="flex-shrink-0 w-80 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5 hover:border-yellow-500/40 transition-all duration-300"
                >
                  {/* Game name */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold">
                      {review.game}
                    </span>
                  </div>

                  {/* Star rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review message */}
                  <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3">
                    &ldquo;{review.message}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">{review.author}</span>
                  </div>
                </div>
              ))}
            </div>
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
      <HeroSection />
      <PainterSection />
      <AIEngineerSection />
      <AnimatorSection />
      <GameDesignerSection />
      <DeveloperSection />

      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
      </div>
    </div>
  );
}
