"use client"
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Film, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Star,
  Clock,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Layers,
  Cpu,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Video data - replace with your actual video paths
const videos = [
  { 
    id: 1, 
    src: "/videos/wild-west.mp4", 
    poster: "/images/video-poster-1.jpg",
    title: "Wild West",
    year: "2024"
  },
  { 
    id: 2, 
    src: "/videos/messi.mp4", 
    poster: "/images/video-poster-2.jpg",
    title: "Soccer Star",
    year: "2024"
  },
  { 
    id: 3, 
    src: "/videos/sanctuary.mp4", 
    poster: "/images/sanctuary.jpg",
    title: "Sanctuary",
    year: "2023"
  },
];

// Scene gallery images - replace with your actual image paths
const sceneGallery = [
  { id: 1, src: "/images/view0.jpg", title: "Opening Shot", category: "Establishing" },
  { id: 2, src: "/images/view1.jpg", title: "Character Introduction", category: "Character" },
  { id: 3, src: "/images/view2.jpg", title: "Environment Design", category: "Environment" },
  { id: 4, src: "/images/view3.jpg", title: "Action Sequence", category: "Animation" },
  { id: 5, src: "/images/view4.jpg", title: "Action Sequence", category: "Animation" },
  { id: 6, src: "/images/view5.jpg", title: "Action Sequence", category: "Animation" },
  { id: 7, src: "/images/view6.jpg", title: "Cowboy Shot", category: "Framing" },
  { id: 8, src: "/images/view7.jpg", title: "Final Blow", category: "Character" },
  // Add more images as needed
];


export default function AnimationPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = videos[currentVideoIndex];

  // Add cinematic animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      @keyframes filmGrain {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-1%, -1%); }
        20% { transform: translate(1%, 1%); }
        30% { transform: translate(-1%, 1%); }
        40% { transform: translate(1%, -1%); }
        50% { transform: translate(-1%, 0); }
        60% { transform: translate(1%, 0); }
        70% { transform: translate(0, -1%); }
        80% { transform: translate(0, 1%); }
        90% { transform: translate(-1%, -1%); }
      }
      @keyframes scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3); }
        50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.7), 0 0 60px rgba(139, 92, 246, 0.4); }
      }
      .cinematic-border {
        position: relative;
        overflow: hidden;
      }
      .cinematic-border::before,
      .cinematic-border::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 10%;
        background: linear-gradient(to bottom, black, transparent);
        pointer-events: none;
        z-index: 10;
      }
      .cinematic-border::before {
        top: 0;
      }
      .cinematic-border::after {
        bottom: 0;
        transform: rotate(180deg);
      }
      .film-overlay {
        pointer-events: none;
        position: absolute;
        inset: 0;
        opacity: 0.03;
        background-image: 
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          );
        animation: scanline 8s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const goToNextVideo = () => {
    setIsPlaying(false);
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const goToPreviousVideo = () => {
    setIsPlaying(false);
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  // Reset playing state when video changes
  useEffect(() => {
    setIsPlaying(false);
  }, [currentVideoIndex]);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Epic Cinematic Background */}
      <div className="fixed inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-purple-950/20" />
        
        {/* Animated cinematic lights */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 top-20 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 bottom-20 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-3xl"
        />
        
        {/* Film grain overlay */}
        <div className="film-overlay" />
      </div>

      <div className="relative z-10">
        {/* Epic Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black/80 to-black/40 backdrop-blur-xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center"
            >
              {/* Studio Badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm"
              >
                <Film className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">AUTODESK MAYA • PREMIERE PRO</span>
              </motion.div>

              {/* Epic Title */}
              <motion.h1
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
                className="mb-6 text-6xl font-bold tracking-wider sm:text-8xl"
                style={{
                  textShadow: "0 0 60px rgba(139, 92, 246, 0.5), 0 0 120px rgba(139, 92, 246, 0.3)",
                  background: "linear-gradient(to right, #fff, #e0e0ff, #fff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ANIMATION
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mx-auto max-w-2xl text-lg text-white/60"
              >
                A visual journey through 3D animation, dynamic cinematography, and storytelling
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex justify-center gap-8"
              >
                {[
                  { icon: Clock, label: "Duration", value: "2:47" },
                  { icon: Layers, label: "Scenes", value: "24" },
                  { icon: Star, label: "FPS", value: "60" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-white/60">{stat.label}:</span>
                    <span className="font-semibold text-white">{stat.value}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Cinematic bars */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
        </motion.div>

        {/* Main Video Section */}
        <div className="mx-auto max-w-7xl px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Card className="group relative overflow-hidden border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
              {/* Glowing border effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 opacity-20 blur-xl transition-opacity group-hover:opacity-30" />
              
              <div className="relative">
                {/* Video Navigation Arrows */}
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  onClick={goToPreviousVideo}
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </motion.button>

                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  onClick={goToNextVideo}
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </motion.button>

                {/* Video Container */}
                <div className="cinematic-border relative aspect-video overflow-hidden bg-black">
                  {/* Video Title and Year Overlay */}
                  <div className="absolute left-6 top-6 z-10">
                    <motion.div
                      key={currentVideo.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="rounded-lg bg-black/50 px-4 py-2 backdrop-blur-md"
                    >
                      <h3 className="text-lg font-bold text-white">{currentVideo.title}</h3>
                      <p className="text-sm text-white/60">{currentVideo.year}</p>
                    </motion.div>
                  </div>

                  {/* Video Dots Indicator */}
                  <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {videos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentVideoIndex(index);
                        }}
                        className={`h-2 w-2 rounded-full transition-all ${
                          index === currentVideoIndex 
                            ? 'w-8 bg-white' 
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Video Element */}
                  <AnimatePresence mode="wait">
                    <motion.video
                      key={currentVideo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      poster={currentVideo.poster}
                      muted={isMuted}
                      loop
                      playsInline
                    >
                      <source src={currentVideo.src} type="video/mp4" />
                      Your browser does not support the video tag.
                    </motion.video>
                  </AnimatePresence>

                  {/* Play/Pause Overlay */}
                  <AnimatePresence>
                    {!isPlaying && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={togglePlayPause}
                          className="rounded-full bg-white/10 p-8 backdrop-blur-md transition-all hover:bg-white/20"
                          style={{ animation: "glow 2s ease-in-out infinite" }}
                        >
                          <Play className="h-12 w-12 text-white" fill="white" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Video Controls Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlayPause}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Video Info Bar */}
                <div className="border-t border-white/10 bg-black/60 p-6 backdrop-blur-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{currentVideo.title} {currentVideo.year}</h2>
                      <p className="mt-1 text-white/60">Character animation, procedural environments, and cinematic sequences</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge className="bg-purple-500/20 text-purple-300">
                        <Award className="mr-1 h-3 w-3" />
                        Video {currentVideoIndex + 1} of {videos.length}
                      </Badge>
                      <Badge className="bg-violet-500/20 text-violet-300">
                        <Sparkles className="mr-1 h-3 w-3" />
                        4K Render
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Scene Gallery Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16"
          >
            {/* Section Header */}
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-4xl font-bold">Scene Gallery</h2>
              <p className="text-white/60">Behind the scenes and key frames from the animation</p>
            </div>

            {/* Image Grid */}
            <motion.div 
              layout
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {sceneGallery.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black/50"
                    onClick={() => setSelectedImage(image.id)}
                  >
                    {/* Image */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />
                      
                      {/* Hover play button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="border-t border-white/10 bg-black/60 p-4">
                      <h3 className="font-semibold">{image.title}</h3>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Production Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { icon: Box, label: "3D Models", value: "47", color: "from-purple-500 to-violet-500" },
              { icon: Layers, label: "Render Layers", value: "120+", color: "from-violet-500 to-pink-500" },
              { icon: Clock, label: "Render Time", value: "96 hrs", color: "from-pink-500 to-rose-500" },
              { icon: Cpu, label: "Polygons", value: "2.4M", color: "from-rose-500 to-orange-500" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur-sm"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity group-hover:opacity-10`} />
                <stat.icon className="mb-3 h-8 w-8 text-white/40" />
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Lightbox for images */}
      <AnimatePresence>
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent 
              className="fixed inset-0 z-50 flex h-screen w-screen max-w-none items-center justify-center border-0 bg-black/95 p-0 data-[state=open]:animate-none translate-x-0 translate-y-0 left-0 top-0"
              style={{
                transform: 'none',
                maxWidth: '100vw',
                maxHeight: '100vh'
              }}
              showCloseButton={false}
            >
              {/* Custom close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 hover:rotate-90"
                aria-label="Close lightbox"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              
              {/* Navigation buttons */}
              <button
                onClick={() => {
                  const currentIndex = sceneGallery.findIndex(img => img.id === selectedImage);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : sceneGallery.length - 1;
                  setSelectedImage(sceneGallery[prevIndex].id);
                }}
                className="absolute left-6 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              
              <button
                onClick={() => {
                  const currentIndex = sceneGallery.findIndex(img => img.id === selectedImage);
                  const nextIndex = currentIndex < sceneGallery.length - 1 ? currentIndex + 1 : 0;
                  setSelectedImage(sceneGallery[nextIndex].id);
                }}
                className="absolute right-6 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
              
              {/* Main image container with better centering */}
              <div className="relative flex h-full w-full items-center justify-center p-12">
                <motion.div
                  key={selectedImage}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="relative flex h-full w-full items-center justify-center"
                >
                  {/* Image with proper constraints */}
                  <img
                    src={sceneGallery.find(img => img.id === selectedImage)?.src}
                    alt={sceneGallery.find(img => img.id === selectedImage)?.title}
                    className="h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-lg object-contain shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
                    }}
                  />
                  
                  {/* Category badge */}
                  <div className="absolute left-4 top-4">
                    <Badge className="bg-purple-500/20 text-purple-300 backdrop-blur-md">
                      {sceneGallery.find(img => img.id === selectedImage)?.category}
                    </Badge>
                  </div>
                </motion.div>
              </div>
              
              {/* Image info overlay at bottom */}
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 20 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8"
              >
                <div className="mx-auto max-w-4xl text-center">
                  <h3 className="mb-2 text-3xl font-bold text-white">
                    {sceneGallery.find(img => img.id === selectedImage)?.title}
                  </h3>
                  <p className="text-white/60">
                    {(() => {
                      const currentIndex = sceneGallery.findIndex(img => img.id === selectedImage);
                      return `${currentIndex + 1} / ${sceneGallery.length} • Use arrow keys to navigate`;
                    })()}
                  </p>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}