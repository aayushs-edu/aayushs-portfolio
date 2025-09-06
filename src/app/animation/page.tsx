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
  Box,
  Eye,
  RotateCcw,
  Settings,
  Zap
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
];

// Sketchfab Embed Component Interface
interface SketchfabEmbedProps {
  modelId?: string;
  width?: string;
  height?: string;
  autostart?: boolean;
  transparent?: boolean;
  showInfo?: boolean;
  className?: string;
}

const SketchfabEmbed: React.FC<SketchfabEmbedProps> = ({
  modelId = "dGUrytaktlEurUwk2Hfv6oGjQKH", // Default example model - replace with your model ID
  width = "100%",
  height = "600px",
  autostart = true,
  transparent = false,
  showInfo = true,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Construct Sketchfab embed URL with proper parameters
  const embedUrl = `https://sketchfab.com/models/${modelId}/embed?` + 
    new URLSearchParams({
      autostart: autostart ? '1' : '0',
      transparent: transparent ? '1' : '0',
      ui_controls: '1',
      ui_infos: showInfo ? '1' : '0',
      ui_stop: '0',
      ui_inspector: '1',
      ui_watermark: '1',
      ui_help: '1',
      ui_settings: '1',
      ui_vr: '1',
      ui_fullscreen: '1',
      ui_annotations: '1'
    }).toString();

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full ${className}`}
    >
      <Card className="relative overflow-hidden border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">3D Model Viewer</h3>
                <p className="text-sm text-white/60">Interactive Character Model</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-300">
                <Zap className="mr-1 h-3 w-3" />
                WebGL
              </Badge>
            </div>
          </div>
        </div>

        {/* Model Container */}
        <div className="relative" style={{ height }}>
          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500"
                />
                <p className="text-white/80">Loading 3D Model...</p>
              </div>
            </motion.div>
          )}

          {/* Sketchfab Iframe - THIS IS THE KEY PART */}
          <iframe
            src={embedUrl}
            width={width}
            height={height}
            style={{ border: 0 }}
            onLoad={handleLoad}
            allow="accelerometer; camera; gyroscope; magnetometer; microphone; fullscreen; xr-spatial-tracking; gamepad"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            title="3D Model Viewer"
            loading="lazy"
          />

          {/* Overlay Controls */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-sm"
            >
              <Eye className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-white/80">Interactive View</span>
            </motion.div>
          </div>
        </div>

        {/* Model Info Footer */}
        {showInfo && (
          <div className="border-t border-white/10 bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-white/60">
                  Use mouse to orbit • Scroll to zoom • Right-click to pan
                </p>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    WebGL Renderer
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    360° Rotation
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Real-time Lighting
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-purple-500/20 text-purple-300">
                  High Quality
                </Badge>
                <Badge className="bg-violet-500/20 text-violet-300">
                  PBR Materials
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default function AnimationPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = videos[currentVideoIndex];

  // Auto-play video when currentVideoIndex changes
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.play();
    }
  }, [currentVideoIndex, isPlaying]);

  // Auto-play first video on mount
  useEffect(() => {
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play();
    }
  }, []);

  const togglePlay = () => {
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
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    setIsPlaying(true);
  };

  const goToPreviousVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsPlaying(true);
  };

  // Update time and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
    };
  }, [currentVideoIndex]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Helper function to format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
        animation: scanline 3s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black overflow-x-hidden">
      {/* Animated background with parallax effect */}
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

      <div className="relative z-10 px-4">
        {/* Header with stunning typography */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
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
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-110"
                >
                  <ChevronLeft className="h-6 w-6" />
                </motion.button>

                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  onClick={goToNextVideo}
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-110"
                >
                  <ChevronRight className="h-6 w-6" />
                </motion.button>

                {/* Video Player */}
                <div className="cinematic-border relative aspect-video">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    src={currentVideo.src}
                    poster={currentVideo.poster}
                    muted={isMuted}
                    loop
                  />
                  
                  {/* Film overlay */}
                  <div className="film-overlay" />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    {/* Progress Bar */}
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-xs text-white/60 font-mono">
                        {formatTime(currentTime)}
                      </span>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer
                                   [&::-webkit-slider-thumb]:appearance-none 
                                   [&::-webkit-slider-thumb]:w-3 
                                   [&::-webkit-slider-thumb]:h-3 
                                   [&::-webkit-slider-thumb]:rounded-full 
                                   [&::-webkit-slider-thumb]:bg-purple-500 
                                   [&::-webkit-slider-thumb]:cursor-pointer
                                   [&::-webkit-slider-thumb]:shadow-lg
                                   [&::-webkit-slider-thumb]:shadow-purple-500/50
                                   [&::-moz-range-thumb]:w-3 
                                   [&::-moz-range-thumb]:h-3 
                                   [&::-moz-range-thumb]:rounded-full 
                                   [&::-moz-range-thumb]:bg-purple-500 
                                   [&::-moz-range-thumb]:cursor-pointer 
                                   [&::-moz-range-thumb]:border-none"
                          style={{
                            background: `linear-gradient(to right, 
                              rgb(147 51 234) 0%, 
                              rgb(147 51 234) ${(currentTime / duration) * 100}%, 
                              rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, 
                              rgba(255,255,255,0.2) 100%)`
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/60 font-mono">
                        {formatTime(duration)}
                      </span>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlay}
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

        {/* 3D Models Section - NEW! */}
        <div className="mx-auto max-w-7xl px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="mb-8 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-4 text-4xl font-bold text-white"
              >
                Interactive 3D Models
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/60"
              >
                Explore our character models in real-time 3D
              </motion.p>
            </div>
            
            {/* Single Container with Three Models */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="w-full"
            >
              <Card className="relative overflow-hidden border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
                {/* Shared Header */}
                <div className="border-b border-white/10 bg-black/60 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
                        <Box className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">3D Model Viewer</h3>
                        <p className="text-sm text-white/60">Interactive Character Models</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-300">
                        <Zap className="mr-1 h-3 w-3" />
                        WebGL
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-300">
                        Triple View
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Top Row - Two Side by Side Models */}
                <div className="grid gap-0 lg:grid-cols-2 border-b border-white/10">
                  {/* First Model */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="relative border-r border-white/10 lg:border-r"
                  >
                    <div className="relative h-[500px]">
                      <iframe
                        src={`https://sketchfab.com/models/507a4bf2b127455f8c06175cd7b97b75/embed?autostart=1&transparent=0&ui_controls=1&ui_infos=0&ui_stop=0&ui_inspector=1&ui_watermark=1&ui_help=1&ui_settings=1&ui_vr=1&ui_fullscreen=1&ui_annotations=1&autostart=1`}
                        width="100%"
                        height="500px"
                        style={{ border: 0 }}
                        allow="accelerometer; camera; gyroscope; magnetometer; microphone; fullscreen; xr-spatial-tracking; gamepad"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                        title="3D Model Viewer - Model 1"
                        loading="lazy"
                      />
                      
                      {/* Model 1 Label */}
                      <div className="absolute bottom-4 left-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 }}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-sm"
                        >
                          <Eye className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-white/80">Main Character</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Second Model */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    className="relative"
                  >
                    <div className="relative h-[500px]">
                      <iframe
                        src={`https://sketchfab.com/models/70655c32ae394827ae4c4a06bf492f63/embed?autostart=0&transparent=0&ui_controls=1&ui_infos=0&ui_stop=0&ui_inspector=1&ui_watermark=1&ui_help=1&ui_settings=1&ui_vr=1&ui_fullscreen=1&ui_annotations=1&autostart=1`}
                        width="100%"
                        height="500px"
                        style={{ border: 0 }}
                        allow="accelerometer; camera; gyroscope; magnetometer; microphone; fullscreen; xr-spatial-tracking; gamepad"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                        title="3D Model Viewer - Model 2"
                        loading="lazy"
                      />
                      
                      {/* Model 2 Label */}
                      <div className="absolute bottom-4 left-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.4 }}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-sm"
                        >
                          <Eye className="h-4 w-4 text-violet-400" />
                          <span className="text-sm text-white/80">Banana Gun</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Row - Full Width Model */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="relative"
                >
                  <div className="relative h-[600px]">
                    <iframe
                      src={`https://sketchfab.com/models/2c19629e61354d138b447e0095232331/embed?autostart=0&transparent=0&ui_controls=1&ui_infos=0&ui_stop=0&ui_inspector=1&ui_watermark=1&ui_help=1&ui_settings=1&ui_vr=1&ui_fullscreen=1&ui_annotations=1&autostart=1`}
                      width="100%"
                      height="600px"
                      style={{ border: 0 }}
                      allow="accelerometer; camera; gyroscope; magnetometer; microphone; fullscreen; xr-spatial-tracking; gamepad"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                      title="3D Model Viewer - Model 3"
                      loading="lazy"
                    />
                    
                    {/* Model 3 Label */}
                    <div className="absolute bottom-4 left-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.6 }}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-sm"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-white/80">Saloon - Featured</span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Shared Footer */}
                <div className="border-t border-white/10 bg-black/60 p-4 backdrop-blur-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-white/60">
                        Use mouse to orbit • Scroll to zoom • Right-click to pan
                      </p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          WebGL Renderer
                        </span>
                        <span className="flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" />
                          360° Rotation
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          Real-time Lighting
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300">
                        High Quality
                      </Badge>
                      <Badge className="bg-violet-500/20 text-violet-300">
                        Arnold
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        

          {/* Scene Gallery Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16"
          >
            {/* Section Header */}
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white">Scene Gallery</h2>
              <p className="text-white/60">Behind-the-scenes looks at key animation moments</p>
            </div>

            {/* Gallery Grid */}
            <motion.div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence>
                {sceneGallery.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={() => setSelectedImage(image.id)}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm transition-all hover:border-purple-500/50"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <motion.img
                        src={image.src}
                        alt={image.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        whileHover={{ scale: 1.1 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-2 left-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Badge className="bg-purple-500/80 text-white">
                          <Camera className="mr-1 h-3 w-3" />
                          {image.category}
                        </Badge>
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