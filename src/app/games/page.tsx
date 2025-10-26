"use client"
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import {
  Play,
  ExternalLink,
  Calendar,
  Download,
  Star,
  Trophy,
  Sparkles,
  Target,
  Clock,
  Users,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Eye,
  Activity,
  Award
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
  // Preferred display fields
  cover: string; // card cover image
  gallery?: string[]; // modal gallery images
  // Legacy optional field kept for compatibility
  image?: string;
  video?: string;
  itchUrl: string;
  githubUrl?: string;
  category: "Platformer" | "Puzzle" | "Action" | "Strategy" | "Shooter" | "Stealth";
  playtime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  multiplayer: boolean;
  awards?: string[];
  accent: string;
  jam: string;
  jamAchievement?: string;
  dimension: "2D" | "3D";
}

// Real game data from your itch.io
const games: Game[] = [
  {
    id: "bounce-back",
    title: "BOUNCE BACK",
    subtitle: "Build around your past self",
    description: "This is a puzzle platformer I made in 11 hours with a unique twist. Your past self brings your end. Any jumps you make leave a mark of danger but also give you platforms to rebuild the level around you to avoid your past marks. You can only move forward, avoiding the remnants of your past self.",
    longDescription: "This is a puzzle platformer I made in 11 hours with a unique twist. Your past self brings your end. Any jumps you make leave a mark of danger but also give you platforms to rebuild the level around you to avoid your past marks. You can only move forward, avoiding the remnants of your past self.",
    features: [
      "Looping mechanic",
      "Progressive difficulty system", 
      "Minimalist aesthetic design",
      "Intuitive two-button controls",
      "Endless replayability"
    ],
    technologies: ["Unity 2022.3 LTS", "C# Scripting", "Physics2D", "WebGL Build"],
    year: "2025",
    status: "Live",
    cover: "/images/bounce-back-cover.webp",
    gallery: [
      "/images/bounce-back-cover.webp",
      "/images/bounce-back-1.webp",
      "/images/bounce-back-2.webp",
      "/images/bounce-back-3.webp"
    ],
    itchUrl: "https://aayushs-edu.itch.io/bounce-back",
    category: "Platformer",
    playtime: "Endless",
    difficulty: "Medium",
    multiplayer: false,
    accent: "from-orange-400 via-red-500 to-pink-500",
    jam: "GMTK Game Jam",
    jamAchievement: "Top 20% Submission",
    dimension: "2D"
  },
  {
    id: "reign-or-ruin",
    title: "REIGN OR RUIN",
    subtitle: "Reign benevolently or get overthrown",
    description: "You must rule over your village in this power management game -- but these aren't ordinary villagers! These AI-powered villagers understand what happens around them, and can make actionable decisions on them...even rebellion.",
    longDescription: "You must defend your village against hoards of enemies while keeping your AI-powered villagers loyal. Hoard too much power and you might get overthrown .. distribute power evenly and it might be okay ... but it might not be the best strategy against enemies. Keeping villagers happy is expensive! And don't accidentally harm them, it's very easy to but could lead to dire consequences!",
    features: [
      "Power management system",
      "Dynamic villager relationships", 
      "Epic combat mechanics",
      "Night wave system",
      "Progressive wave difficulty",
      "Council decision-making"
    ],
    technologies: ["Unity 6", "Player2 AI SDK", "LLM Integration", "Tilemap System", "Audio Manager", "Navmesh"],
    year: "2025",
    status: "Live",
    cover: "/images/reign-or-ruin-cover.webp",
    gallery: [
      "/images/reign-or-ruin-cover.webp",
      "/images/reign-or-ruin-1.webp",
      "/images/reign-or-ruin-2.webp",
      "/images/reign-or-ruin-3.webp"
    ],
    itchUrl: "https://aayushs-edu.itch.io/reign-or-ruin",
    category: "Strategy",
    playtime: "30 min",
    difficulty: "Hard",
    multiplayer: false,
    accent: "from-red-400 via-orange-500 to-yellow-500",
    jam: "Player2 AI NPC Jam",
    jamAchievement: "$50 Reward, Special Mention",
    dimension: "2D"
  },
  {
    id: "biscuit-bandit",
    title: "BISCUIT BANDIT",
    subtitle: "Don't get caught by your parents!",
    description: "Risk it for the Biscuit -- you're literally risking it for the family biscuits, trying to get them all for yourself. But be careful, your parents are lurking, ready to catch you. You must use stealth and strategy to sneak your way to the biscuit and sneak your way back, night after night.",
    longDescription: "Risk it for the Biscuit -- you're literally risking it for the family biscuits, trying to get them all for yourself. But be careful, your parents are lurking, ready to catch you. You must use stealth and strategy to sneak your way to the biscuit and sneak your way back, night after night.",
    features: [
      "Stealth-based gameplay",
      "Charming pixel art style", 
      "Multiple approach strategies",
      "Environmental interaction",
      "Progressive difficulty curve",
      "Collectible achievements"
    ],
    technologies: ["Unity 2022.3", "2D Animation", "Stealth AI System", "Navmesh AI", "Sound Design"],
    year: "2025",
    status: "Live",
    cover: "/images/biscuit-bandit-cover.webp",
    gallery: [
      "/images/biscuit-bandit-cover.webp",
    ],
    itchUrl: "https://aayushs-edu.itch.io/biscuit-bandit",
    category: "Stealth",
    playtime: "10-15 min",
    difficulty: "Medium",
    multiplayer: false,
    accent: "from-amber-400 via-yellow-500 to-orange-500",
    jam: "Brackeys 2025.2 Jam",
    dimension: "2D"
  },
  {
    id: "murphys-rocket",
    title: "MURPHY'S ROCKET",
    subtitle: "When everything that can go wrong, does",
    description: "Earth’s under a robot takeover, so humans must set foot on Mars. You are the only scientist left, Murphy, and need to build a rocket as fast as possible and only the entire fate of humanity is at stake. Of course, according to Murphy’s law, everything that can go wrong will go wrong. Use a special weapon to ignite the robots with electricity, and defend the rocket at all costs!",
    longDescription: "Earth’s under a robot takeover, so humans must set foot on Mars. You are the only scientist left, Murphy, and need to build a rocket as fast as possible and only the entire fate of humanity is at stake. Of course, according to Murphy’s law, everything that can go wrong will go wrong. Use a special weapon to ignite the robots with electricity, and defend the rocket at all costs!",
    features: [
      "Dynamic failure systems",
      "Physics-based flight controls",
      "Procedural obstacle generation",
      "Humorous failure animations",
      "Adaptive difficulty scaling",
      "Replay value through chaos"
    ],
    technologies: ["Unity 2023.2", "Rigidbody Physics", "Procedural Generation", "Particle Systems", "Comedy Timing AI"],
    year: "2025",
    status: "Live",
    cover: "/images/murphys-rocket-cover.webp",
    gallery: [
      "/images/murphys-rocket-cover.webp",
      "/images/murphys-rocket-1.webp",
      "/images/murphys-rocket-2.webp",
      "/images/murphys-rocket-3.webp",
      "/images/murphys-rocket-4.webp",
      "/images/murphys-rocket-5.webp",
      "/images/murphys-rocket-6.webp"
    ],
    itchUrl: "https://aayushs-edu.itch.io/murphys-rocket",
    category: "Action",
    playtime: "30 min",
    difficulty: "Medium",
    multiplayer: false,
    accent: "from-blue-400 via-purple-500 to-pink-500",
    jam: "Brackeys 2025.1 Jam",
    dimension: "3D"
  }
];

// Reviews data structure
interface Review {
  id: string;
  author: string;
  message: string;
  game: string;
  gameId: string;
  rating: number;
}

const reviews: Review[] = [
  // Reign Or Ruin Reviews
  { id: "r1", author: "Player2 Judge", message: "Interesting concept! I like the style, audio design, and combat design. The game did get stuck on the first night when speaking with the council though. Thanks for your submission!", game: "Reign Or Ruin", gameId: "reign-or-ruin", rating: 4 },
  { id: "r2", author: "Player2 Judge", message: "THIS IS AWESOME! I know it's a WIP so I give you that. LOVE THIS! This is a great concept and I know you could get this published on steam as a full game!!!!", game: "Reign Or Ruin", gameId: "reign-or-ruin", rating: 5 },
  { id: "r3", author: "ToucheToucan", message: "Man they hate me, they just had a mass rebellion against me. Cool idea!", game: "Reign Or Ruin", gameId: "reign-or-ruin", rating: 4 },
  { id: "r4", author: "wenzhe-elefant", message: "I would give 10 for creativity, but yeah need a bit more polish", game: "Reign Or Ruin", gameId: "reign-or-ruin", rating: 4 },
  { id: "r5", author: "Dyrkabes", message: "I really like the visuals! Very well done, all in one thematic.", game: "Reign Or Ruin", gameId: "reign-or-ruin", rating: 5 },
  { id: "r6", author: "Dyrkabes", message: "The council/rebellion thing has a lot of potential, interesting, that you have to balance what AI \"thinks\" about you", game: "Reign Or Ruin", gameId: "reign-or-ruin", rating: 5 },

  // Bounce Back Reviews
  { id: "b1", author: "Redya Games", message: "Simple and addicting game, I love it!", game: "Bounce Back", gameId: "bounce-back", rating: 5 },
  { id: "b2", author: "gambitono", message: "like the idea and the visuals neon!!!", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b3", author: "xefensor", message: "Interesting idea. Though you can just keep multiplying you score by warping back to back.", game: "Bounce Back", gameId: "bounce-back", rating: 3 },
  { id: "b4", author: "KDeveloper", message: "Great concept but quite simple. I think it could be neat if there were more types of platforms and/or ways to gain new platforms", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b5", author: "ClemGames", message: "Neat concept and idea!", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b6", author: "cachandlerdev", message: "The music and visuals look good!", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b7", author: "Mat Eliot", message: "I did horrible but still enjoyed! Good game.", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b8", author: "AA Games", message: "Pretty fun concept, My record was 157. Got confused a lot of times when I got reversed XD. I liked strategic approach of this one. Good job :D", game: "Bounce Back", gameId: "bounce-back", rating: 5 },
  { id: "b9", author: "Macientosh", message: "Cool concept. The game is fun and controls feel good for the most part. Gameplay basically becomes a strategy game and how much you can optimize on block so makes it pretty replayable too.", game: "Bounce Back", gameId: "bounce-back", rating: 5 },
  { id: "b10", author: "LEGENDBOSS123", message: "Fun game.", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b11", author: "NotamGames", message: "This concept is simple, but it's really good and well executed. It really made me wanna optimize my strategy and change my approach every leg, great work!", game: "Bounce Back", gameId: "bounce-back", rating: 5 },
  { id: "b12", author: "Bill the Ball", message: "This is a very neat game", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b13", author: "dogma quest", message: "The screen wrapping and upside down platforming is really cool!", game: "Bounce Back", gameId: "bounce-back", rating: 4 },
  { id: "b14", author: "keeramel", message: "Very nice game! my high score is 285", game: "Bounce Back", gameId: "bounce-back", rating: 5 },

  // Biscuit Bandit Reviews
  { id: "bb1", author: "Trash Pandas", message: "Really good concept, and i think it's very well polished for a 1-person week-long game.", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 5 },
  { id: "bb2", author: "ollie-dickson-6262", message: "Cool idea, and fun to play, maybe could've done with a bit more of a tutorial or something but good job!", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 4 },
  { id: "bb3", author: "jamesedra", message: "pretty fun game! I really liked the setting and turning off the lights", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 4 },
  { id: "bb4", author: "CaseM", message: "really fun game! I liked the line so I knew where someone could see me, that was a nice detail that helped with the 2d aspect of it. Overall, a fantastic game!", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 5 },
  { id: "bb5", author: "AEPSchmitt", message: "This is really solid little stealth game! It was really fun trying to strategically turn off the lights. Pretty incredible difficulty balancing and level design for a game jam.", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 5 },
  { id: "bb6", author: "BetterCallKrishna", message: "Didn't finished it but it was fun to play", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 4 },
  { id: "bb7", author: "SamiCode Games", message: "Amazing Pixel Art, Very Fun", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 5 },
  { id: "bb8", author: "Swynwraig Games", message: "Really good game! The darkness and music are a great addition, really added to the suspense!", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 5 },
  { id: "bb9", author: "Karim D.", message: "Really well executed! the mechanics work great, you can really feel the pressure from the parents, and it's always clear what's happening on screen (the purple line is a nice touch), also nice graphics & ambiance!", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 5 },
  { id: "bb10", author: "theDwarf80", message: "oh this game is nuts great job i love the gameplay but it tis a bit dark 👍😁", game: "Biscuit Bandit", gameId: "biscuit-bandit", rating: 4 }
];

// Analytics Dashboard Component
function AnalyticsDashboard() {
  const stats = [
    {
      icon: Eye,
      value: "1000+",
      label: "Views",
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/30"
    },
    {
      icon: Download,
      value: "23",
      label: "Downloads",
      gradient: "from-green-500 to-emerald-500",
      shadow: "shadow-green-500/30"
    },
    {
      icon: Users,
      value: "3",
      label: "Followers",
      gradient: "from-purple-500 to-pink-500",
      shadow: "shadow-purple-500/30"
    },
    {
      icon: Star,
      value: "30+",
      label: "Reviews",
      gradient: "from-yellow-500 to-orange-500",
      shadow: "shadow-yellow-500/30"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="mb-12 grid gap-4 grid-cols-2 md:grid-cols-4 max-w-4xl mx-auto"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          whileHover={{ scale: 1.05, y: -3 }}
        >
          <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-lg hover:border-white/40 transition-all duration-300 group">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
            <CardContent className="relative py-3 px-4 text-center">
              <motion.div
                className={`mx-auto mb-1.5 h-9 w-9 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon className="h-4 w-4 text-white" />
              </motion.div>
              <motion.div
                className="text-xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {stat.value}
              </motion.div>
              <div className={`text-xs font-medium bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.label}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}


// Reviews Section Component
function ReviewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-cycle through reviews
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 3) % reviews.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Get current 3 reviews to display
  const getVisibleReviews = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(reviews[(currentIndex + i) % reviews.length]);
    }
    return visible;
  };

  const visibleReviews = getVisibleReviews();

  // Find game accent color
  const getGameAccent = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    return game ? game.accent : "from-purple-400 to-pink-400";
  };

  return (
    <section className="mb-20">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <h2 className="mb-3 text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          PLAYER REVIEWS
        </h2>
        <p className="text-white/70 text-lg">What players are saying about these games</p>
      </motion.div>

      <div
        className="grid gap-6 md:grid-cols-3"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <AnimatePresence mode="wait">
          {visibleReviews.map((review, index) => (
            <motion.div
              key={`${review.id}-${currentIndex}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
            >
              <Card className="h-full border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-lg hover:border-white/40 transition-all duration-300">
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Game name and rating */}
                  <div className="mb-4">
                    <Badge className={`bg-gradient-to-r ${getGameAccent(review.gameId)} text-white font-bold mb-2`}>
                      {review.game}
                    </Badge>
                    <div className="flex items-center gap-1 mt-2">
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
                  </div>

                  {/* Review message */}
                  <p className="text-white/90 text-sm leading-relaxed flex-grow mb-4">
                    &ldquo;{review.message}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">{review.author}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.ceil(reviews.length / 3) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i * 3)}
            className={`h-2 transition-all duration-300 ${
              Math.floor(currentIndex / 3) === i
                ? "w-8 bg-gradient-to-r from-yellow-400 to-orange-400"
                : "w-2 bg-white/30 hover:bg-white/50"
            } rounded-full`}
            aria-label={`Go to review set ${i + 1}`}
          />
        ))}
      </div>
    </section>
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
          className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-20 pointer-events-none`}
        />

        <CardHeader className="p-0">
          <div className="relative aspect-video overflow-hidden">
            {/* Cover image */}
            <Image
              src={game.cover || game.image || "/images/view0.webp"}
              alt={`${game.title} cover`}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

            {/* Status and Jam Badges */}
            <motion.div
              className="absolute left-4 top-4 flex flex-col gap-2"
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
            >
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30">
                <Activity className="mr-1 h-3 w-3" />
                LIVE
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30">
                <Trophy className="mr-1 h-3 w-3" />
                {game.jam}
              </Badge>
              {game.jamAchievement && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold shadow-lg shadow-yellow-500/30">
                  <Award className="mr-1 h-3 w-3" />
                  {game.jamAchievement}
                </Badge>
              )}
            </motion.div>

            {/* View details overlay */}
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`border-2 bg-gradient-to-r ${game.accent} bg-clip-text text-transparent font-bold`}>
                  {game.category.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white/80">
                  {game.dimension}
                </Badge>
              </div>
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
            <div className="flex gap-3 relative z-10">
              <Button
                asChild
                size="sm"
                className={`flex-1 bg-gradient-to-r ${game.accent} hover:scale-105 transition-transform duration-300 shadow-lg font-bold cursor-pointer pointer-events-auto`}
              >
                <a href={game.itchUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
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
  const [activeIndex, setActiveIndex] = useState(0);

  if (!game) return null;
  const images = (game.gallery && game.gallery.length > 0)
    ? game.gallery
    : [game.cover || game.image || "/images/view0.webp"];
  const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIndex((i) => (i + 1) % images.length);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-[85vw] md:max-w-xl lg:max-w-2xl xl:max-w-3xl overflow-y-auto overflow-x-hidden bg-gradient-to-br from-neutral-950/95 via-neutral-900/95 to-neutral-950/95 backdrop-blur-2xl border border-white/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 w-full"
        >
          {/* Epic header */}
          <div className="relative">
            <motion.div 
              className={`absolute inset-0 bg-gradient-to-r ${game.accent} opacity-20 blur-3xl`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30 text-xs py-0.5">
                  <Activity className="mr-1 h-2.5 w-2.5" />
                  LIVE ON ITCH.IO
                </Badge>
                <Badge variant="outline" className={`border bg-gradient-to-r ${game.accent} bg-clip-text text-transparent font-bold text-xs py-0.5`}>
                  {game.category}
                </Badge>
                <Badge variant="outline" className="text-xs py-0.5">{game.dimension}</Badge>
                <Badge variant="outline" className="text-xs py-0.5">{game.year}</Badge>
              </div>
              <h2 className={`text-xl font-bold bg-gradient-to-r ${game.accent} bg-clip-text text-transparent mb-1`}>
                {game.title}
              </h2>
              <p className="text-sm text-white/90 font-medium">{game.subtitle}</p>
            </div>
          </div>

          {/* Image gallery */}
          <div className="w-full">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black">
              <Image
                src={images[activeIndex]}
                alt={`${game.title} screenshot ${activeIndex + 1}`}
                fill
                className={game.id === "murphys-rocket" ? "object-contain" : "object-cover"}
                sizes="(max-width: 768px) 100vw, 85vw"
              />
              {images.length > 1 && (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActiveIndex(i)}
                    className={`relative h-8 w-14 flex-shrink-0 overflow-hidden rounded border ${i === activeIndex ? "border-white" : "border-white/20"}`}
                    aria-label={`Show image ${i + 1}`}
                  >
                    <Image
                      src={src}
                      alt="thumbnail"
                      fill
                      className={game.id === "murphys-rocket" ? "object-contain bg-black" : "object-cover"}
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Game details content */}
          <div className="grid gap-3 lg:grid-cols-2 w-full">
            <div>
              <h3 className="mb-2 text-base font-bold text-white">About This Game</h3>
              <p className="text-xs text-white/90 leading-relaxed">{game.longDescription}</p>
            </div>

            <div>
              <h3 className="mb-2 text-base font-bold text-white">Key Features</h3>
              <div className="space-y-1.5 mb-3">
                {game.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className={`h-1 w-1 rounded-full bg-gradient-to-r ${game.accent}`} />
                    <span className="text-xs text-white/90">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <h3 className="mb-2 text-base font-bold text-white">Technologies</h3>
              <div className="flex flex-wrap gap-1">
                {game.technologies.map((tech, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-white/30 text-white/80 text-xs py-0.5 px-2"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <Button 
            asChild 
            size="sm"
            className={`w-full bg-gradient-to-r ${game.accent} hover:scale-105 transition-transform duration-300 shadow-lg font-bold text-xs`}
          >
            <a href={game.itchUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-3 w-3" />
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


  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white [color-scheme:dark] overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-950 to-transparent pointer-events-none z-10" />
      {/* Animated background with parallax effect */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

        {/* Animated gradient orbs */}
        <motion.div
          style={{ y: backgroundY }}
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-3xl"
        />
        <motion.div
          style={{ y: backgroundY }}
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl"
        />
      </div>

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
            GAMES
          </motion.h1>
          
          <motion.p 
            className="mb-8 text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <span className="text-white/60 text-lg mt-2 block">
              Powered by Unity Engine • Built with C# • Deployed as WebGL
            </span>
          </motion.p>
        </motion.div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Game Jams Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h2 className="mb-3 text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              FEATURED GAMES
            </h2>
            <p className="text-white/70 text-lg">Game jam submissions playable on itch.io</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {games.map((game, index) => (
              <EpicGameCard
                key={game.id}
                game={game}
                index={index}
                onSelect={() => openGameModal(game)}
              />
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <ReviewsSection />

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
