"use client"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Palette, Calendar, Maximize2, X } from "lucide-react"

// Types
type PaintingItem = {
  id: string
  src: string
  title: string
  description?: string
  year?: number
  medium?: string
  size?: string
  wallPosition?: "portfolio" | "pre-portfolio"
  gridPosition?: { row: number; col: number; span?: number }
}

// Utility
const classNames = (...args: (string | false | null | undefined)[]): string => args.filter(Boolean).join(" ")

// Hooks
function usePaintings(manifestUrl = "/paintings/manifest.json") {
  const [items, setItems] = useState<PaintingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(manifestUrl, { cache: "no-store" })
        if (!res.ok) throw new Error(`Manifest not found (${res.status})`)
        const json = await res.json()
        const arr = Array.isArray(json) ? json : json.items
        if (!Array.isArray(arr)) throw new Error("Invalid manifest format")
        if (!cancelled) setItems(arr)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load paintings")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [manifestUrl])

  return { items, loading, error }
}

// Components
// Updated PaintingCard component
function PaintingCard({
  painting,
  onClick,
  delay = 0,
  isCenter = false
}: {
  painting: PaintingItem
  onClick: () => void
  delay?: number
  isCenter?: boolean
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    cardRef.current.style.setProperty('--mouse-x', `${x}%`)
    cardRef.current.style.setProperty('--mouse-y', `${y}%`)
  }

  // Consistent hover scale for all cards
  const getHoverScale = () => {
    return 1.05
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ 
        duration: 0.7, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: getHoverScale(),
        rotateY: 5,
        z: 50
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer preserve-3d"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      {/* Dynamic gradient that follows mouse */}
      <div 
        className="absolute -inset-0.5 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
            rgba(139, 92, 246, 0.15), 
            transparent 40%)`
        }}
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-black shadow-2xl transition-all duration-500 hover:shadow-[0_30px_60px_rgba(139,92,246,0.3)]">
        {/* Loading shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0">
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-neutral-800 to-neutral-900" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        )}
        
        {/* Multi-layer frame effect */}
        <div className="relative">
          {/* Outer frame */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:ring-violet-500/30" />
          
          {/* Inner frame with gradient */}
          <div className="border-[3px] border-transparent bg-gradient-to-br from-neutral-800 via-neutral-900 to-black p-3 transition-all duration-500 group-hover:from-violet-900/20 group-hover:via-neutral-900 group-hover:to-purple-900/20">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={painting.src}
                alt={painting.title}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={classNames(
                  "h-full w-full object-cover transition-all duration-700",
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
                  isHovered ? "scale-110" : ""
                )}
              />
              
              {/* Animated light reflection */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-0 -translate-x-full animate-[slide_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Hover overlay with blur backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 flex items-end bg-gradient-to-t from-black/90 via-black/40 to-transparent backdrop-blur-[2px]"
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
            transition={{ delay: 0.1 }}
            className="w-full p-5"
          >
            <h3 className="text-lg font-bold text-white drop-shadow-lg">{painting.title}</h3>
            {painting.year && (
              <p className="mt-1 text-sm text-white/80">{painting.year}</p>
            )}
            {painting.medium && (
              <p className="mt-2 text-xs text-violet-300">{painting.medium}</p>
            )}
          </motion.div>
        </motion.div>

        {/* Floating action button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="absolute right-4 top-4"
            >
              <div className="rounded-full bg-violet-600/90 p-3 shadow-lg backdrop-blur-sm transition-colors hover:bg-violet-500">
                <Maximize2 className="h-5 w-5 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-20 w-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute left-3 top-3 h-12 w-12 border-l-2 border-t-2 border-violet-400/50 rounded-tl-lg" />
        </div>
        <div className="absolute bottom-0 right-0 h-20 w-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute bottom-3 right-3 h-12 w-12 border-b-2 border-r-2 border-violet-400/50 rounded-br-lg" />
        </div>
      </div>

      {/* Special glow effects */}
      {isCenter && (
        <div className="absolute -inset-4 -z-10 opacity-50">
          <div className="h-full w-full animate-pulse rounded-3xl bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-violet-600/20 blur-2xl" />
        </div>
      )}
      
    </motion.div>
  )
}

function WallLayout({ paintings, onOpen }: { paintings: PaintingItem[]; onOpen: (idx: number) => void }) {
  const portfolioPaintings = paintings.filter(p => p.wallPosition === "portfolio")
  
  // Map specific paintings to their wall positions based on the actual photo
  const getPaintingByTitle = (title: string) => 
    portfolioPaintings.find(p => p.title.toLowerCase().includes(title.toLowerCase()))
  
  const seaTurtle = getPaintingByTitle("snorkeling") || getPaintingByTitle("turtle")
  const snowboarding = getPaintingByTitle("snowboard")
  const soccer = getPaintingByTitle("soccer") || getPaintingByTitle("penalty")
  const stillLife = getPaintingByTitle("childhood") || getPaintingByTitle("toys")
  const safari = getPaintingByTitle("safari")
  const tajMahal = getPaintingByTitle("taj")
  const redDead = getPaintingByTitle("red dead")
  
  return (
    <div className="mx-auto max-w-6xl perspective-1000">
      <motion.div
        initial={{ opacity: 0, rotateX: 10 }}
        animate={{ opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative"
      >
        {/* Animated background layers */}
        <div className="absolute -inset-10 -z-10">
          {/* Gradient orbs */}
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-600/10 blur-3xl animation-delay-2000" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-indigo-600/10 blur-3xl animation-delay-4000" />
        </div>

        {/* Main container with glass effect */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-950/90 to-black/95 p-8 shadow-[0_20px_70px_rgba(139,92,246,0.15)] backdrop-blur-xl">
          {/* Animated grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div 
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(90deg, transparent 0%, transparent 49%, rgba(139, 92, 246, 0.5) 49%, rgba(139, 92, 246, 0.5) 51%, transparent 51%, transparent 100%),
                                  linear-gradient(0deg, transparent 0%, transparent 49%, rgba(139, 92, 246, 0.5) 49%, rgba(139, 92, 246, 0.5) 51%, transparent 51%, transparent 100%)`,
                backgroundSize: '50px 50px',
                animation: 'grid-move 20s linear infinite'
              }}
            />
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-1 animate-float rounded-full bg-violet-400/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${10 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>

          {/* Wall layout */}
          <div className="relative z-10 hidden md:grid md:grid-cols-[1.3fr_1.3fr_1.3fr] gap-5 items-stretch">
            {/* Left Column */}
            <div className="flex flex-col gap-5 self-center">
              {seaTurtle && (
                <PaintingCard
                  painting={seaTurtle}
                  onClick={() => onOpen(paintings.indexOf(seaTurtle))}
                  delay={0.1}
                />
              )}
              {snowboarding && (
                <PaintingCard
                  painting={snowboarding}
                  onClick={() => onOpen(paintings.indexOf(snowboarding))}
                  delay={0.2}
                />
              )}
            </div>

            {/* Center Column */}
            <div className="flex flex-col gap-5">
              {soccer && (
                <PaintingCard
                  painting={soccer}
                  onClick={() => onOpen(paintings.indexOf(soccer))}
                  delay={0.3}
                />
              )}
              {stillLife && (
                <PaintingCard
                  painting={stillLife}
                  onClick={() => onOpen(paintings.indexOf(stillLife))}
                  delay={0.4}
                  isCenter={true}
                />
              )}
              {tajMahal && (
                <PaintingCard
                  painting={tajMahal}
                  onClick={() => onOpen(paintings.indexOf(tajMahal))}
                  delay={0.5}
                />
              )}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-5 self-center">
              {safari && (
                <PaintingCard
                  painting={safari}
                  onClick={() => onOpen(paintings.indexOf(safari))}
                  delay={0.6}
                />
              )}
              {redDead && (
                <PaintingCard
                  painting={redDead}
                  onClick={() => onOpen(paintings.indexOf(redDead))}
                  delay={0.7}
                />
              )}
            </div>
          </div>

          {/* Mobile layout */}
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {portfolioPaintings.map((painting, idx) => (
              <PaintingCard
                key={painting.id}
                painting={painting}
                onClick={() => onOpen(paintings.indexOf(painting))}
                delay={idx * 0.1}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function GridLayout({ paintings, onOpen }: { paintings: PaintingItem[]; onOpen: (idx: number) => void }) {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <AnimatePresence mode="popLayout">
        {paintings.map((painting, idx) => (
          <PaintingCard
            key={painting.id}
            painting={painting}
            onClick={() => onOpen(idx)}
            delay={idx * 0.05}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

function PaintingLightbox({
  painting,
  onClose,
  onPrev,
  onNext,
}: {
  painting: PaintingItem | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (painting) {
      setImageLoaded(false)
      // Preload image
      const img = new Image()
      img.onload = () => {
        setImageLoaded(true)
      }
      img.src = painting.src
    }
  }, [painting])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!painting) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [painting, onPrev, onNext, onClose]);

  if (!painting) return null

  return (
    <Dialog open={!!painting} onOpenChange={onClose}>
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
          onClick={onClose}
          className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 hover:rotate-90"
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6 text-white" />
        </button>
        
        {/* Navigation buttons */}
        <button
          onClick={onPrev}
          className="absolute left-6 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
          aria-label="Previous painting"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        
        <button
          onClick={onNext}
          className="absolute right-6 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
          aria-label="Next painting"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
        
        {/* Main image container with better centering */}
        <div className="relative flex h-full w-full items-center justify-center p-12">
          <motion.div
            key={painting.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {/* Loading state */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-violet-600/20 border-t-violet-600" />
              </div>
            )}
            
            {/* Image with proper constraints */}
            <img
              src={painting.src}
              alt={painting.title}
              className={`h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-lg object-contain shadow-2xl transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
              }}
            />
            
            {/* Year badge */}
            {painting.year && (
              <div className="absolute left-4 top-4">
                <Badge className="bg-purple-500/20 text-purple-300 backdrop-blur-md">
                  <Calendar className="mr-1 h-3 w-3" />
                  {painting.year}
                </Badge>
              </div>
            )}
            
            {/* Medium badge */}
            {painting.medium && (
              <div className="absolute right-4 top-4">
                <Badge className="bg-violet-500/20 text-violet-300 backdrop-blur-md">
                  <Palette className="mr-1 h-3 w-3" />
                  {painting.medium}
                </Badge>
              </div>
            )}
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
              {painting.title}
            </h3>
            {painting.description && (
              <p className="mb-3 text-lg text-white/70">
                {painting.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-white/60">
              {painting.size && (
                <span className="flex items-center gap-1">
                  <span className="text-violet-400">•</span> {painting.size}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="text-violet-400">•</span> {painting.wallPosition === "portfolio" ? "Portfolio" : "Early Work"}
              </span>
            </div>
            <p className="mt-3 text-sm text-white/50">
              Use arrow keys to navigate • Press ESC to close
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// Main Component
export default function PaintingsPage() {
  const { items: paintings, loading, error } = usePaintings()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [view, setView] = useState<"wall" | "grid">("wall")

  const portfolioPaintings = paintings.filter(p => p.wallPosition === "portfolio")
  const prePortfolioPaintings = paintings.filter(p => p.wallPosition === "pre-portfolio")

  const openPainting = (idx: number) => setSelectedIndex(idx)
  const closeLightbox = () => setSelectedIndex(null)
  const prevPainting = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + paintings.length) % paintings.length)
    }
  }
  const nextPainting = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % paintings.length)
    }
  }

  // Add global styles for animations
  useEffect(() => {
      const style = document.createElement('style')
      style.textContent = `
        @keyframes shimmer {
          to { transform: translateX(200%); }
        }
        @keyframes slide {
          to { transform: translateX(200%) skewX(-12deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-30px) translateX(10px); }
          66% { transform: translateY(30px) translateX(-10px); }
        }
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .preserve-3d { transform-style: preserve-3d; }
        .perspective-1000 { perspective: 1000px; }
      `
      document.head.appendChild(style)
      return () => { document.head.removeChild(style); }
    }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-950 to-transparent pointer-events-none z-10" />
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

      <div className="relative z-10 px-4 py-16">
        {/* Header with stunning typography */}
        <div className="mx-auto mb-16 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6 inline-block"
            >
              <div className="rounded-full bg-gradient-to-r from-violet-600/20 to-purple-600/20 px-6 py-2 backdrop-blur-sm">
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-sm font-medium text-transparent">
                  FINE ART COLLECTION
                </span>
              </div>
            </motion.div>
            
            <h1 className="mb-6 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl">
              Art Portfolio
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-white/60 leading-relaxed">
              A curated collection of oil paintings exploring light, color, and emotion through landscapes, portraits, and moments captured in time
            </p>
          </motion.div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="relative">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-violet-600/20 border-t-violet-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600/20 border-b-purple-600" style={{ animationDirection: 'reverse' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur-sm"
          >
            <p className="text-red-400">Error loading paintings: {error}</p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && !error && paintings.length > 0 && (
          <>
            {/* Portfolio Wall Section */}
            <section className="mb-24">
              <div className="mx-auto mb-10 max-w-7xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <h2 className="text-4xl font-bold text-white">High School Portfolio</h2>
                    <p className="mt-2 text-white/50">
                      Recreating my studio wall arrangement in digital form
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setView("wall")}
                      className={classNames(
                        "rounded-full px-6 py-2 font-medium transition-all",
                        view === "wall"
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/25"
                          : "border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                      )}
                    >
                      Wall View
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setView("grid")}
                      className={classNames(
                        "rounded-full px-6 py-2 font-medium transition-all",
                        view === "grid"
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/25"
                          : "border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                      )}
                    >
                      Grid View
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {view === "wall" ? (
                <WallLayout paintings={paintings} onOpen={openPainting} />
              ) : (
                <div className="mx-auto max-w-7xl">
                  <GridLayout paintings={portfolioPaintings} onOpen={openPainting} />
                </div>
              )}
            </section>

            {/* Pre-Portfolio Section */}
            {prePortfolioPaintings.length > 0 && (
              <section>
                <div className="mx-auto mb-10 max-w-7xl">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <h2 className="text-4xl font-bold text-white">Earlier Works</h2>
                    <p className="mt-2 text-white/50">
                      Paintings created before high school
                    </p>
                  </motion.div>
                </div>
                <div className="mx-auto max-w-7xl">
                  <GridLayout paintings={prePortfolioPaintings} onOpen={openPainting} />
                </div>
              </section>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && paintings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-16 text-center backdrop-blur-sm"
          >
            <p className="text-white/60">No paintings found. Please add paintings to the manifest.</p>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <PaintingLightbox
        painting={selectedIndex !== null ? paintings[selectedIndex] : null}
        onClose={closeLightbox}
        onPrev={prevPainting}
        onNext={nextPainting}
      />
    </div>
  )
}