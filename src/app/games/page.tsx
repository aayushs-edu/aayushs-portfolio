"use client"
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Gamepad2, 
  Play, 
  ExternalLink,
  Calendar,
  Download,
  Star,
  Trophy,
  Sparkles,
  Zap,
  Brain,
  Target,
  Layers,
  Clock,
  Users,
  Globe,
  Code,
  ChevronRight,
  Github,
  Cpu,
  Rocket,
  Eye,
  Settings,
  RotateCcw,
  Box,
  Atom,
  Gamepad,
  MonitorPlay,
  Joystick,
  Controller,
  Activity,
  TrendingUp,
  Award,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Game data structure
interface Game {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  features: string[];
  technologies: string[];
  year: string;
  status: "Live" | "In Development" | "Beta";
  image: string;
  video?: string;
  itchUrl: string;
  githubUrl?: string;
  category: "Platformer" | "Puzzle" | "Action" | "Strategy" | "Shooter";
  playtime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  multiplayer: boolean;
  awards?: string[];
  accent: string;
  isFeatured?: boolean;
  embedUrl?: string;
}

// Real game data from your itch.io
const games: Game[] = [
  {
    id: "bounce-back",
    title: "BOUNCE BACK",
    subtitle: "Master the art of temporal echoes",
    description: "An innovative platformer where every jump creates an echo. Navigate through levels by building upon your past attempts, creating complex temporal chains.",
    longDescription: "Bounce Back revolutionizes platforming with its unique temporal echo system. Each time you attempt a level, your previous path becomes a ghostly trail that can help or hinder your next attempt. Master the art of using your past selves to reach new heights and solve increasingly complex puzzles.",
    features: [
      "Temporal echo mechanics",
      "Progressive difficulty system", 
      "Minimalist aesthetic design",
      "Intuitive one-button controls",
      "Physics-based puzzle solving",
      "Endless replayability"
    ],
    technologies: ["Unity 2022.3 LTS", "C# Scripting", "Physics2D", "WebGL Build", "Custom Animation System"],
    year: "2024",
    status: "Live",
    image: "/images/bounce-back-screenshot.jpg",
    itchUrl: "https://aayushs-edu.itch.io/bounce-back",
    category: "Platformer",
    playtime: "20-30 min",
    difficulty: "Medium",
    multiplayer: false,
    accent: "from-orange-400 via-red-500 to-pink-500",
    isFeatured: true,
    embedUrl: "https://aayushs-edu.itch.io/bounce-back/embed"
  },
  {
    id: "reign-or-ruin",
    title: "REIGN OR RUIN",
    subtitle: "Medieval strategy meets modern warfare",
    description: "Command armies through epic battles where tactical decisions determine the fate of kingdoms. Blend medieval strategy with innovative combat mechanics.",
    longDescription: "Reign or Ruin combines classic medieval strategy with modern tactical gameplay. Lead diverse armies, manage resources, and make crucial decisions that will either establish your reign or lead to your ruin. Features dynamic weather systems that affect combat and strategic depth that rewards both planning and adaptation.",
    features: [
      "Deep tactical combat system",
      "Dynamic weather effects", 
      "Multiple army compositions",
      "Resource management mechanics",
      "Branching campaign paths",
      "Epic battle animations"
    ],
    technologies: ["Unity 2023.1", "Advanced AI Systems", "Custom Shaders", "Tilemap System", "Audio Manager"],
    year: "2024",
    status: "Live",
    image: "/images/reign-or-ruin-screenshot.jpg",
    itchUrl: "https://aayushs-edu.itch.io/reign-or-ruin",
    category: "Strategy",
    playtime: "45-60 min",
    difficulty: "Hard",
    multiplayer: false,
    accent: "from-red-400 via-orange-500 to-yellow-500"
  },
  {
    id: "biscuit-bandit",
    title: "BISCUIT BANDIT",
    subtitle: "Stealth, strategy, and snacks",
    description: "A charming stealth game where you play as a mischievous character on a mission to steal delicious biscuits without getting caught.",
    longDescription: "Biscuit Bandit offers a delightful twist on stealth gameplay. Navigate through kitchens, avoid detection, and execute the perfect heist to claim your biscuity prizes. With charming pixel art and intuitive stealth mechanics, every level presents new challenges and opportunities for creative problem-solving.",
    features: [
      "Stealth-based gameplay",
      "Charming pixel art style", 
      "Multiple approach strategies",
      "Environmental interaction",
      "Progressive difficulty curve",
      "Collectible achievements"
    ],
    technologies: ["Unity 2022.3", "2D Animation", "Stealth AI System", "Pixel Perfect Camera", "Sound Design"],
    year: "2024",
    status: "Live",
    image: "/images/biscuit-bandit-screenshot.jpg",
    itchUrl: "https://aayushs-edu.itch.io/biscuit-bandit",
    category: "Action",
    playtime: "25-35 min",
    difficulty: "Easy",
    multiplayer: false,
    accent: "from-amber-400 via-yellow-500 to-orange-500"
  },
  {
    id: "murphys-rocket",
    title: "MURPHY'S ROCKET",
    subtitle: "When everything that can go wrong, does",
    description: "A physics-based space adventure where Murphy's Law reigns supreme. Navigate through increasingly chaotic scenarios where failure is part of the fun.",
    longDescription: "Murphy's Rocket embraces the chaos of space exploration with a healthy dose of humor. Control a rocket through increasingly unpredictable scenarios where systems fail, physics goes haywire, and success comes from adapting to constant adversity. Every flight is a unique experience of controlled chaos.",
    features: [
      "Dynamic failure systems",
      "Physics-based flight controls", 
      "Procedural obstacle generation",
      "Humorous failure animations",
      "Adaptive difficulty scaling",
      "Replay value through chaos"
    ],
    technologies: ["Unity 2023.2", "Rigidbody Physics", "Procedural Generation", "Particle Systems", "Comedy Timing AI"],
    year: "2024",
    status: "Live",
    image: "/images/murphys-rocket-screenshot.jpg",
    itchUrl: "https://aayushs-edu.itch.io/murphys-rocket",
    category: "Shooter",
    playtime: "15-25 min",
    difficulty: "Medium",
    multiplayer: false,
    accent: "from-blue-400 via-purple-500 to-pink-500"
  }
];

// Analytics Dashboard Component
function AnalyticsDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="mb-16"
    >
      <div className="mb-8">
        <h2 className="mb-3 text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          CREATOR ANALYTICS
        </h2>
        <p className="text-white/70 text-lg">Live performance metrics from itch.io</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-white/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <div className="mb-3 mx-auto h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">614</div>
            <div className="text-sm text-white/70">Total Views</div>
          </CardContent>
        </Card>

        <Card className="border-white/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <div className="mb-3 mx-auto h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">18</div>
            <div className="text-sm text-white/70">Downloads</div>
          </CardContent>
        </Card>

        <Card className="border-white/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <div className="mb-3 mx-auto h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">3</div>
            <div className="text-sm text-white/70">Followers</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// Featured Game Component with Unity Embed
function FeaturedGame({ game }: { game: Game }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, type: "spring" }}
      className="mb-20"
    >
      <div className="mb-8 text-center">
        <Badge className="mb-4 gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold">
          <Star className="h-4 w-4" />
          FEATURED GAME
        </Badge>
        <h2 className={`text-5xl font-bold bg-gradient-to-r ${game.accent} bg-clip-text text-transparent mb-4`}>
          {game.title}
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">{game.subtitle}</p>
      </div>

      <Card className="border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-lg overflow-hidden">
        <div className="relative">
          {/* Unity WebGL Embed */}
          <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
            <iframe
              src={game.embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              className="w-full h-full"
              title={`${game.title} - Unity WebGL Game`}
            />
            
            {/* Fullscreen button */}
            <Button
              size="sm"
              variant="outline"
              className="absolute top-4 right-4 bg-black/50 border-white/30 hover:bg-black/70"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">About This Game</h3>
                <p className="text-white/80 leading-relaxed mb-6">{game.longDescription}</p>
                
                <div className="flex gap-4 mb-6">
                  <div className="text-center">
                    <div className={`mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-r ${game.accent} flex items-center justify-center`}>
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-medium text-white">{game.playtime}</div>
                  </div>
                  <div className="text-center">
                    <div className={`mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-r ${game.accent} flex items-center justify-center`}>
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-medium text-white">{game.difficulty}</div>
                  </div>
                  <div className="text-center">
                    <div className={`mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-r ${game.accent} flex items-center justify-center`}>
                      <Gamepad2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-medium text-white">{game.category}</div>
                  </div>
                </div>

                <Button 
                  asChild 
                  size="lg" 
                  className={`bg-gradient-to-r ${game.accent} hover:scale-105 transition-transform duration-300 shadow-lg font-bold`}
                >
                  <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    PLAY ON ITCH.IO
                  </a>
                </Button>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Key Features</h3>
                <div className="space-y-3 mb-6">
                  {game.features.map((feature, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${game.accent}`} />
                      <span className="text-white/90">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-white mb-3">Technology Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {game.technologies.map((tech, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="border-white/30 text-white/80"
                    >
                      {tech.includes('Unity') && (
                        <svg width="12" height="12" viewBox="0 0 256 263" className="mr-1 text-white">
                          <path
                            fill="currentColor"
                            d="M128 0L238.4 68.5v127L128 263.5L17.6 195.5v-127L128 0zm0 37.2L50.4 79.7v88.6L128 226.3l77.6-58v-88.6L128 37.2z"
                          />
                        </svg>
                      )}
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <div className="aspect-video w-full">
            <iframe
              src={game.embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              className="w-full h-full rounded"
              title={`${game.title} - Unity WebGL Game (Fullscreen)`}
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Floating particle system
function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
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
  );
}

// Epic game card with enhanced visuals
function EpicGameCard({ game, index, onSelect }: { game: Game; index: number; onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Platformer": return Rocket;
      case "Puzzle": return Brain;
      case "Action": return Zap;
      case "Strategy": return Cpu;
      case "Shooter": return Target;
      default: return Gamepad2;
    }
  };

  const CategoryIcon = getCategoryIcon(game.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.2,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.03,
        rotateY: 2,
        z: 50,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group perspective-1000"
    >
      <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-neutral-900/80 via-neutral-800/60 to-neutral-900/80 backdrop-blur-lg transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:shadow-purple-500/20">
        
        {/* Animated background gradient */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-20`}
        />

        <CardHeader className="p-0">
          <div className="relative aspect-video overflow-hidden">
            {/* Game screenshot placeholder - replace with actual screenshots */}
            <div className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-60`} />
            
            {/* Central game icon with Unity integration */}
            <div className="flex h-full items-center justify-center">
              <motion.div
                animate={{ 
                  rotate: isHovered ? 360 : 0,
                  scale: isHovered ? 1.2 : 1
                }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <motion.div
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${game.accent} blur-xl opacity-50`}
                  animate={{ scale: isHovered ? 1.5 : 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Unity-powered badge */}
                <div className="absolute -top-2 -right-2 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-lg"
                  >
                    <svg width="14" height="14" viewBox="0 0 256 263" className="text-black">
                      <path
                        fill="currentColor"
                        d="M128 0L238.4 68.5v127L128 263.5L17.6 195.5v-127L128 0zm0 37.2L50.4 79.7v88.6L128 226.3l77.6-58v-88.6L128 37.2z"
                      />
                    </svg>
                  </motion.div>
                </div>
                <CategoryIcon className="relative h-16 w-16 text-white drop-shadow-lg" />
              </motion.div>
            </div>

            {/* Status Badge */}
            <motion.div 
              className="absolute left-4 top-4"
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
            >
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30">
                <Activity className="mr-1 h-3 w-3" />
                LIVE
              </Badge>
            </motion.div>

            {/* Epic play button overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <Button
                    size="lg"
                    className="gap-3 bg-white/20 text-white backdrop-blur-md border border-white/30 hover:bg-white/30 transform hover:scale-105 transition-all duration-300 shadow-2xl"
                    onClick={onSelect}
                  >
                    <Play className="h-5 w-5" />
                    VIEW DETAILS
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="outline" className={`border-2 bg-gradient-to-r ${game.accent} bg-clip-text text-transparent font-bold`}>
                {game.category.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Calendar className="h-3 w-3" />
                {game.year}
              </div>
            </div>

            <h3 className="mb-2 text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {game.title}
            </h3>
            <p className={`mb-3 text-sm font-medium bg-gradient-to-r ${game.accent} bg-clip-text text-transparent`}>
              {game.subtitle}
            </p>
            <p className="mb-4 text-sm text-white/80 leading-relaxed line-clamp-3">
              {game.description}
            </p>

            {/* Enhanced stats */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className={`mx-auto mb-1 h-8 w-8 rounded-full bg-gradient-to-r ${game.accent} flex items-center justify-center`}>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="text-xs font-medium">{game.playtime}</div>
              </div>
              <div className="text-center">
                <div className={`mx-auto mb-1 h-8 w-8 rounded-full bg-gradient-to-r ${game.accent} flex items-center justify-center`}>
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div className="text-xs font-medium">{game.difficulty}</div>
              </div>
              <div className="text-center">
                <div className={`mx-auto mb-1 h-8 w-8 rounded-full bg-gradient-to-r ${game.accent} flex items-center justify-center`}>
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="text-xs font-medium">Single Player</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button 
                asChild 
                size="sm" 
                className={`flex-1 bg-gradient-to-r ${game.accent} hover:scale-105 transition-transform duration-300 shadow-lg font-bold`}
              >
                <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
                  <Rocket className="mr-2 h-4 w-4" />
                  PLAY NOW
                </a>
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Enhanced game details modal
function EpicGameModal({ game, isOpen, onClose }: { game: Game | null; isOpen: boolean; onClose: () => void }) {
  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto bg-gradient-to-br from-neutral-950/95 via-neutral-900/95 to-neutral-950/95 backdrop-blur-2xl border border-white/20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Epic header */}
          <div className="relative">
            <motion.div 
              className={`absolute inset-0 bg-gradient-to-r ${game.accent} opacity-20 blur-3xl`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30">
                  <Activity className="mr-1 h-3 w-3" />
                  LIVE ON ITCH.IO
                </Badge>
                <Badge variant="outline" className={`border-2 bg-gradient-to-r ${game.accent} bg-clip-text text-transparent font-bold`}>
                  {game.category}
                </Badge>
                <Badge variant="outline">{game.year}</Badge>
              </div>
              <h2 className={`text-4xl font-bold bg-gradient-to-r ${game.accent} bg-clip-text text-transparent mb-2`}>
                {game.title}
              </h2>
              <p className="text-xl text-white/90 font-medium">{game.subtitle}</p>
            </div>
          </div>

          {/* Game details content */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 text-2xl font-bold text-white">About This Game</h3>
              <p className="text-white/90 leading-relaxed mb-6">{game.longDescription}</p>
            </div>

            <div>
              <h3 className="mb-4 text-2xl font-bold text-white">Key Features</h3>
              <div className="space-y-3">
                {game.features.map((feature, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${game.accent}`} />
                    <span className="text-white/90">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <Button 
            asChild 
            size="lg" 
            className={`w-full bg-gradient-to-r ${game.accent} hover:scale-105 transition-transform duration-300 shadow-2xl font-bold text-lg`}
          >
            <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-3 h-5 w-5" />
              PLAY ON ITCH.IO
            </a>
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// Main epic component
export default function EpicGamesPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const headerScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  const openGameModal = (game: Game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const featuredGame = games.find(game => game.isFeatured);
  const otherGames = games.filter(game => !game.isFeatured);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white [color-scheme:dark] relative overflow-hidden">
      {/* Epic aurora background */}
      <motion.div 
        style={{ y: backgroundY }}
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-purple-800/30 to-fuchsia-900/40" />
        <motion.div 
          className="absolute inset-0 opacity-60"
          animate={{
            background: [
              "radial-gradient(60% 40% at 20% 10%, rgb(139 92 246 / 0.4), transparent 60%), radial-gradient(50% 30% at 80% 0%, rgb(236 72 153 / 0.3), transparent 60%), radial-gradient(40% 40% at 50% 100%, rgb(59 130 246 / 0.4), transparent 60%)",
              "radial-gradient(60% 40% at 30% 20%, rgb(236 72 153 / 0.4), transparent 60%), radial-gradient(50% 30% at 70% 10%, rgb(59 130 246 / 0.3), transparent 60%), radial-gradient(40% 40% at 60% 90%, rgb(139 92 246 / 0.4), transparent 60%)",
              "radial-gradient(60% 40% at 20% 10%, rgb(139 92 246 / 0.4), transparent 60%), radial-gradient(50% 30% at 80% 0%, rgb(236 72 153 / 0.3), transparent 60%), radial-gradient(40% 40% at 50% 100%, rgb(59 130 246 / 0.4), transparent 60%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 backdrop-blur-[1px]" />
      </motion.div>

      {/* Floating particles */}
      <FloatingParticles />

      <div className="relative mx-auto max-w-7xl px-4 py-12">
        {/* Epic header */}
        <motion.div
          style={{ scale: headerScale }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring", stiffness: 100 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-1"
          >
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-black">
              {/* Unity Logo */}
              <motion.svg
                width="48"
                height="48"
                viewBox="0 0 256 263"
                className="drop-shadow-lg"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <defs>
                  <linearGradient id="unityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#e0e7ff" />
                    <stop offset="100%" stopColor="#c7d2fe" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#unityGradient)"
                  d="M128 0L238.4 68.5v127L128 263.5L17.6 195.5v-127L128 0zm0 37.2L50.4 79.7v88.6L128 226.3l77.6-58v-88.6L128 37.2zm50.7 71.9L128 136.3L77.3 109.1l50.7-27.2l50.7 27.2zM77.3 154.9L128 127.7l50.7 27.2L128 182.1L77.3 154.9z"
                />
              </motion.svg>
            </div>
          </motion.div>

          <motion.h1 
            className="mb-4 text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent md:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            UNITY LABORATORY
          </motion.h1>
          
          <motion.p 
            className="mb-8 text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Interactive experiences built with Unity Engine. From innovative mechanics to engaging gameplay, 
            each project explores new frontiers in game development.
            <br />
            <span className="text-white/60 text-lg mt-2 block">
              Powered by Unity Engine • Built with C# • Deployed as WebGL
            </span>
          </motion.p>
        </motion.div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Featured Game Section */}
        {featuredGame && <FeaturedGame game={featuredGame} />}

        {/* Other Games Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h2 className="mb-3 text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              MORE GAMES
            </h2>
            <p className="text-white/70 text-lg">Additional Unity projects and prototypes</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {otherGames.map((game, index) => (
              <EpicGameCard
                key={game.id}
                game={game}
                index={index}
                onSelect={() => openGameModal(game)}
              />
            ))}
          </div>
        </section>

        {/* Epic call to action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-12 backdrop-blur-lg">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-6 h-16 w-16"
              >
                <Sparkles className="h-16 w-16 text-purple-400" />
              </motion.div>
              <h3 className="mb-4 text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                EXPLORE MORE GAMES
              </h3>
              <p className="mb-8 text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
                Visit my itch.io profile to play all games, view development logs, and stay updated on new releases.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl shadow-purple-500/30 hover:scale-105 transition-all duration-300 font-bold"
              >
                <a href="https://aayushs-edu.itch.io/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-3 h-5 w-5" />
                  VIEW ITCH.IO PROFILE
                </a>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Epic game modal */}
      <EpicGameModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}