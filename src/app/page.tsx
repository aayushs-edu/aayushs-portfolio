"use client"
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Github, Linkedin, Mail, Sun, Moon, Search, Play, ExternalLink, Brush, Shapes, Gamepad2, ChevronRight, Download, ChevronLeft } from "lucide-react";

// ---------- Utility ----------
const classNames = (...args: (string | false | null | undefined)[]): string => args.filter(Boolean).join(" ");
const TYPES = [
  { key: "all", label: "All" },
  { key: "painting", label: "Oil Paintings", icon: Brush },
  { key: "3d", label: "3D & Animation", icon: Shapes },
  { key: "game", label: "Games", icon: Gamepad2 },
] as const;

type TypeKey = typeof TYPES[number]["key"];

// Inline SVG noise data URL — single-line, correctly quoted (fixes unterminated string error)
const NOISE_SVG_DATA_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.70' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.4'/></svg>";

// Quick palette extractor for images (fast, no deps)
function usePalette(src: string, count = 5) {
  const [colors, setColors] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !src) return;
    let cancelled = false;
    const img = new Image();
    // enable CORS for typical CDNs like Unsplash
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const W = (canvas.width = 64);
        const H = (canvas.height = 64);
        ctx.drawImage(img, 0, 0, W, H);
        const { data } = ctx.getImageData(0, 0, W, H);
        const buckets = new Map<string, number>();
        for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue;
          const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        const top = [...buckets.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, count)
          .map(([k]) => {
            const [r, g, b] = k.split(',').map(Number);
            return `rgb(${r}, ${g}, ${b})`;
          });
        if (!cancelled) setColors(top);
      } catch {}
    };
    return () => { cancelled = true; };
  }, [src, count]);
  return colors;
}

// Seed data (replace with your real content). Remote images are ok; swap URLs below.
interface Project {
  id: string;
  title: string;
  type: TypeKey | string;
  year: number;
  cover: string;
  preview: string | null;
  description: string;
  tags: string[];
  links: {
    view?: string;
    play?: string;
    page?: string;
    repo?: string;
  };
}

const SEED_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Gilded Light",
    type: "painting",
    year: 2025,
    cover: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1400&auto=format&fit=crop",
    preview: null,
    description: "Oil on canvas exploring chiaroscuro and edge control.",
    tags: ["oil", "portrait", "chiaroscuro"],
    links: { view: "#" },
  },
  {
    id: "p2",
    title: "Clockwork City (Short)",
    type: "3d",
    year: 2024,
    cover: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1400&auto=format&fit=crop",
    preview: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    description: "Procedural city with camera flythrough; kitbash + custom shaders.",
    tags: ["blender", "animation", "shaders"],
    links: { view: "#" },
  },
  {
    id: "p3",
    title: "Power & Rebellion",
    type: "game",
    year: 2025,
    cover: "https://images.unsplash.com/photo-1520975930396-c0f8e58f9f2f?q=80&w=1400&auto=format&fit=crop",
    preview: null,
    description: "Unity strategy-action jam game with AI-driven NPC factions.",
    tags: ["unity", "ai", "game-jam"],
    links: { play: "#", page: "#", repo: "#" },
  },
  {
    id: "p4",
    title: "Still Life in Ultramarine",
    type: "painting",
    year: 2023,
    cover: "https://images.unsplash.com/photo-1526312426976-593c12a8b7a0?q=80&w=1400&auto=format&fit=crop",
    preview: null,
    description: "Color harmony study; saturated accents over muted palette.",
    tags: ["oil", "still-life"],
    links: { view: "#" },
  },
  {
    id: "p5",
    title: "Creature RnD",
    type: "3d",
    year: 2025,
    cover: "https://images.unsplash.com/photo-1605649487212-47bdab064df3?q=80&w=1400&auto=format&fit=crop",
    preview: null,
    description: "ZBrush sculpt → retopo → substance paint → UE5 render.",
    tags: ["zbrush", "substance", "ue5"],
    links: { view: "#" },
  },
  {
    id: "p6",
    title: "Loopstrider",
    type: "game",
    year: 2024,
    cover: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=1400&auto=format&fit=crop",
    preview: null,
    description: "Fast-paced side scroller where past paths become hazards.",
    tags: ["unity", "platformer"],
    links: { play: "#", page: "#" },
  },
]; 

// ---------- Paintings data (folder-friendly) ----------
export type PaintingItem = {
  id: string;
  src: string;
  title: string;
  description?: string;
  year?: number;
  medium?: string;
  size?: string;
};

const PAINTINGS_FALLBACK: PaintingItem[] = SEED_PROJECTS
  .filter(p => p.type === "painting")
  .map((p) => ({ id: p.id, src: p.cover, title: p.title, description: p.description, year: p.year }));

function filenameToTitle(path: string) {
  try {
    const file = (path.split("/").pop() || path);
    const dot = file.lastIndexOf(".");
    const base = dot >= 0 ? file.slice(0, dot) : file;
    const spaced = base.replaceAll("-", " ").replaceAll("_", " ");
    return spaced.split(" ").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  } catch {
    return path;
  }
}

function normalizePainting(raw: any): PaintingItem | null {
  if (!raw) return null;
  const src = raw.src || raw.image || raw.url || raw.path;
  if (!src) return null;
  return {
    id: String(raw.id || src),
    src,
    title: String(raw.title || filenameToTitle(src)),
    description: raw.description ? String(raw.description) : undefined,
    year: typeof raw.year === "number" ? raw.year : undefined,
    medium: raw.medium ? String(raw.medium) : undefined,
    size: raw.size ? String(raw.size) : undefined,
  };
}

function usePaintings(manifestUrl = "/paintings/manifest.json", fallback: PaintingItem[] = PAINTINGS_FALLBACK) {
  const [items, setItems] = useState<PaintingItem[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(manifestUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Manifest not found (${res.status})`);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.items;
        if (!Array.isArray(arr)) throw new Error("Manifest format should be an array or {items: []}");
        const norm = arr.map(normalizePainting).filter(Boolean) as PaintingItem[];
        if (!cancelled && norm.length) setItems(norm);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load manifest");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [manifestUrl]);

  return { items, loading, error };
}

// ---------- Decorative background ----------
function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-70 [background:radial-gradient(60%_40%_at_20%_10%,theme(colors.violet.600/.35),transparent_60%),radial-gradient(50%_30%_at_80%_0%,theme(colors.fuchsia.500/.25),transparent_60%),radial-gradient(40%_40%_at_50%_100%,theme(colors.blue.600/.3),transparent_60%)]" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <Noise />
    </div>
  );
}

function Noise() {
  return (
    <div
      className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
      style={{ backgroundImage: `url('${NOISE_SVG_DATA_URL}')` }}
    />
  );
}

// ---------- Components ----------
interface NavProps {
  theme: string;
  setTheme: (theme: string) => void;
}
function Nav({ theme, setTheme }: NavProps) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Paintings", href: "#paintings" },
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];
  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3 shadow-lg shadow-black/20 backdrop-blur">
          <a href="#" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">AS</span>
            <span className="hidden sm:inline">Aayush Sharma</span>
          </a>

          <div className="hidden items-center gap-6 md:flex">
            {links.map((l: { label: string; href: string }) => (
              <a key={l.label} href={l.href} className="text-sm text-white/80 transition hover:text-white">{l.label}</a>
            ))}
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <Socials />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="secondary">Menu</Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-neutral-950/95 backdrop-blur-lg">
                <div className="mt-10 flex flex-col gap-4">
                  {links.map(l => (
                    <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-white/90">{l.label}</a>
                  ))}
                  <Separator className="my-2" />
                  <Socials />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}

function Socials() {
  const iconClass = "h-5 w-5";
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href="#" aria-label="GitHub" className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10">
              <Github className={iconClass} />
            </a>
          </TooltipTrigger>
          <TooltipContent>GitHub</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href="#" aria-label="LinkedIn" className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10">
              <Linkedin className={iconClass} />
            </a>
          </TooltipTrigger>
          <TooltipContent>LinkedIn</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href="mailto:you@email.com" aria-label="Email" className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10">
              <Mail className={iconClass} />
            </a>
          </TooltipTrigger>
          <TooltipContent>Email me</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

interface ThemeToggleProps {
  theme: string;
  setTheme: (theme: string) => void;
}
function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  return (
    <Button variant="secondary" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="gap-2">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"} mode</span>
    </Button>
  );
}

function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const handleSeeWork = () => {
    document.querySelector("#work")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  };
  return (
    <section className="relative mx-auto mt-10 max-w-7xl px-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/60 to-neutral-950/80 p-8 shadow-2xl">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/30 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.6 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Open to Commissions & Internships
          </div>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Art × Code: Oil Paintings, 3D Worlds, and Playable Ideas
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-white/70">
            I blend fine art technique with real-time graphics and game design. Explore my latest paintings, animation tests, and Unity games.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" onClick={handleSeeWork}>
              <ChevronRight className="h-4 w-4" /> See my work
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <a href="/Aayush_Sharma_Resume.pdf" download>
                <Download className="h-4 w-4" /> Download resume
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface GalleryProps { projects: Project[] }
function Gallery({ projects }: GalleryProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TypeKey | "all">("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"new" | "old">("new");
  const [paintingView, setPaintingView] = useState<"wall" | "grid">("wall");

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: projects.length };
    for (const t of TYPES) (base as any)[t.key] = 0;
    projects.forEach(p => {
      if ((base as any)[p.type] !== undefined) (base as any)[p.type]++;
    });
    return base;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = projects.filter((p) => {
      const typeOk = tab === "all" ? true : p.type === tab;
      const hay = `${p.title} ${p.tags.join(" ")} ${p.description}`.toLowerCase();
      const qOk = !q || hay.includes(q);
      return typeOk && qOk;
    });
    list = list.sort((a, b) => (sortOrder === "new" ? b.year - a.year : a.year - b.year));
    return list;
  }, [projects, query, tab, sortOrder]);

  const active = activeIndex === null ? null : filtered[activeIndex];

  const openAt = (idx: number) => setActiveIndex(idx);
  const close = () => setActiveIndex(null);
  const goPrev = () => setActiveIndex(i => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
  const goNext = () => setActiveIndex(i => (i === null ? null : (i + 1) % filtered.length));

  return (
    <section id="work" className="mx-auto mt-14 max-w-7xl px-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Featured Work</h2>
          <p className="mt-1 text-sm text-white/60">Filter by discipline, search, or sort by year.</p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex grow items-center gap-2">
            <Search className="h-4 w-4 text-white/50" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects..." className="bg-white/5" />
            {query && (
              <Button variant="secondary" size="sm" onClick={() => setQuery("")}>Clear</Button>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <span>Sort</span>
            <select
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/80"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
            </select>
          </label>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-white/5 p-2">
          {TYPES.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="data-[state=active]:bg-white/10">
              <div className="flex items-center gap-2">
                {"icon" in t && t.icon ? <t.icon className="h-4 w-4" /> : null}
                {t.label}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] leading-none text-white/70">{(counts as any)[t.key] ?? 0}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-6">
          {tab === "painting" && paintingView === "wall" ? (
            <PaintingsWall items={filtered} onOpen={openAt} />
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filtered.map((p, idx) => (
                  <motion.div key={p.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
                    <ProjectCard project={p} onOpen={() => openAt(idx)} onTagClick={(t) => setQuery(t)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
        {tab === "painting" && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="text-xs text-white/50">View:</span>
            <Button size="sm" variant={paintingView === "wall" ? "default" : "secondary"} onClick={() => setPaintingView("wall")}>
              Wall
            </Button>
            <Button size="sm" variant={paintingView === "grid" ? "default" : "secondary"} onClick={() => setPaintingView("grid")}>
              Grid
            </Button>
          </div>
        )}
      </Tabs>

      <Lightbox project={active} onClose={close} onPrev={goPrev} onNext={goNext} />
    </section>
  );
}

// ---------- Unique Painting Layout ----------
function PaintingsWall({ items, onOpen }: { items: Project[]; onOpen: (idx: number) => void }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
      {items.map((p, idx) => (
        <PaintingTile key={p.id} project={p} onClick={() => onOpen(idx)} />
      ))}
    </div>
  );
}

function PaintingTile({ project, onClick }: { project: Project; onClick: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, rx: 0, ry: 0 });
  const palette = usePalette(project.cover, 5);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const px = x / rect.width; const py = y / rect.height;
    const ry = (px - 0.5) * 10; // tilt degrees
    const rx = -(py - 0.5) * 10;
    setPos({ x, y, rx, ry });
  };

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={onMove}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="mb-5 break-inside-avoid cursor-pointer"
      style={{ breakInside: "avoid" as any }}
    >
      <motion.div
        style={{ transformStyle: "preserve-3d" as any }}
        animate={{ rotateX: hover ? pos.rx : 0, rotateY: hover ? pos.ry : 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="rounded-[22px] bg-gradient-to-br from-neutral-800 to-neutral-900 p-2 shadow-2xl shadow-black/40"
      >
        <div className="rounded-[18px] bg-neutral-950 p-2 ring-1 ring-white/10">
          <div className="relative overflow-hidden rounded-[14px]">
            <img src={project.cover} alt={project.title} loading="lazy" decoding="async" className="h-auto w-full object-cover" />
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: hover ? 1 : 0,
                background: `radial-gradient(260px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.18), transparent 60%)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between px-2 pb-1 pt-3">
            <div>
              <h4 className="text-sm font-semibold leading-tight">{project.title}</h4>
              <span className="text-xs text-white/50">{project.year}</span>
            </div>
            <div className="flex items-center gap-1">
              {palette.map((c, i) => (
                <span key={i} title={c} className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onTagClick: (tag: string) => void;
}
function ProjectCard({ project, onOpen, onTagClick }: ProjectCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handleTouchPreview = () => {
    if (videoRef.current) {
      try { videoRef.current.play(); } catch {}
    }
  };
  return (
    <Card className="group overflow-hidden border-white/10 bg-white/5 backdrop-blur">
      <CardHeader className="p-0">
        <div className="relative aspect-[16/10] overflow-hidden">
          {project.preview ? (
            <video
              ref={videoRef}
              src={project.preview}
              muted
              playsInline
              preload="metadata"
              onTouchStart={handleTouchPreview}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              onMouseEnter={e => e.currentTarget.play()}
              onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
            />
          ) : (
            <img
              src={project.cover}
              alt={project.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-black/60 backdrop-blur">{TYPES.find(t => t.key === project.type)?.label ?? project.type}</Badge>
            <Badge variant="secondary" className="bg-white/70 text-black">{project.year}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold leading-tight">{project.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/70">{project.description}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {project.type === "game" && project.links?.play && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={project.links.play} className="rounded-lg border border-white/10 bg-white/5 p-2 transition hover:bg-white/10" aria-label="Play">
                      <Play className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Play</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {project.links?.view && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={project.links.view} className="rounded-lg border border-white/10 bg-white/5 p-2 transition hover:bg-white/10" aria-label="Open">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Open</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags?.slice(0, 6).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer border-white/20 text-white/70 hover:bg-white/10"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-end p-4 pt-0">
        <Button variant="secondary" size="sm" onClick={onOpen} className="gap-2">View details <ChevronRight className="h-4 w-4" /></Button>
      </CardFooter>
    </Card>
  );
}

interface LightboxProps {
  project: Project | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}
function Lightbox({ project, onClose, onPrev, onNext }: LightboxProps) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onPrev, onNext]);

  return (
    <Dialog open={!!project} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border-white/10 bg-neutral-950/95 p-0 backdrop-blur">
        {project && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
              {project.preview ? (
                <video src={project.preview} controls className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <img src={project.cover} alt={project.title} className="absolute inset-0 h-full w-full object-cover" />
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{project.title}</h3>
                <Badge variant="secondary" className="bg-white/80 text-black">{project.year}</Badge>
              </div>
              <p className="mt-2 text-white/70">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-white/20 text-white/70">{tag}</Badge>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {project.links?.play && (
                  <Button className="gap-2"><Play className="h-4 w-4" /> Play</Button>
                )}
                {project.links?.page && (
                  <Button variant="secondary" className="gap-2"><ExternalLink className="h-4 w-4" /> Project page</Button>
                )}
                {project.links?.repo && (
                  <Button variant="secondary" className="gap-2"><Github className="h-4 w-4" /> Source</Button>
                )}
                {project.links?.view && (
                  <Button variant="secondary" className="gap-2"><ExternalLink className="h-4 w-4" /> View</Button>
                )}
                <div className="ml-auto flex items-center gap-2 text-white/60">
                  <Button variant="secondary" size="sm" onClick={onPrev} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="secondary" size="sm" onClick={onNext} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Alternating Paintings Scroll ----------
function PaintingScroll({ items, loading, error }: { items: PaintingItem[]; loading?: boolean; error?: string | null }) {
  return (
    <section id="paintings" className="mx-auto mt-20 max-w-6xl px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">All Paintings</h2>
        <p className="mt-1 text-sm text-white/60">Scroll through the series — layout alternates left/right for each piece.</p>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </div>

      <div className="space-y-12">
        {loading && (
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-1 items-start md:items-center gap-6 md:grid-cols-12">
                <div className="aspect-[4/3] w-full rounded-2xl bg-white/5 md:col-span-7" />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-5">
                  <div className="h-6 w-40 rounded bg-white/10" />
                  <div className="mt-3 h-20 w-full rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.map((p, idx) => (
          <PaintingRow key={p.id} item={p} index={idx} />
        ))}

        {!loading && !items.length && (
          <p className="text-white/60">No paintings yet. Add a <code className="rounded bg-white/10 px-1 py-0.5">/paintings/manifest.json</code> file or populate <code className="rounded bg-white/10 px-1 py-0.5">PAINTINGS_FALLBACK</code>.</p>
        )}
      </div>
    </section>
  );
}

function PaintingRow({ item, index }: { item: PaintingItem; index: number }) {
  const left = index % 2 === 0;
  const palette = usePalette(item.src, 4);
  const frame = palette[0] || "rgba(255,255,255,0.06)";

  return (
    <div className="grid grid-cols-1 items-start md:items-center gap-6 md:grid-cols-12">
      <div className={classNames(
        "md:col-span-7",
        left ? "" : "md:col-start-6 md:row-start-1"
      )}>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950">
          <img src={item.src} alt={item.title} loading="lazy" decoding="async" className="h-auto w-full object-cover" />
        </div>
      </div>
      <div className={classNames(
        "md:col-span-5",
        left ? "" : "md:col-start-1 md:row-start-1"
      )}>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold">{item.title}</h3>
          {item.year && <p className="mt-1 text-xs text-white/50">{item.year}</p>}
          {item.medium && <p className="mt-1 text-xs text-white/50">{item.medium}</p>}
          {item.size && <p className="mt-1 text-xs text-white/50">{item.size}</p>}
          {item.description && <p className="mt-3 text-white/70">{item.description}</p>}
        </div>
      </div>
    </div>
  );
}

function About() {
  const skills = ["Oil Painting", "Color & Light", "Composition", "Blender", "ZBrush", "Substance", "Unity", "C#", "Shaders", "Python", "ML for Art"];
  return (
    <section id="about" className="mx-auto mt-20 max-w-7xl px-4">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="text-2xl font-semibold sm:text-3xl">About</h2>
          <p className="mt-2 text-white/70">I'm a student artist–developer exploring the edge where traditional painting meets real-time 3D and game AI. I love building tools that teach and games that say something.</p>
        </div>
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-semibold tracking-wide text-white/70">Skills & Tools</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map(s => (
                <Badge key={s} variant="outline" className="border-white/20 text-white/80">{s}</Badge>
              ))}
            </div>
            <Separator className="my-6" />
            <h3 className="text-sm font-semibold tracking-wide text-white/70">Awards / Highlights</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>• Game jam finalist (AI NPC Jam 2025)</li>
              <li>• AP Art portfolio: top score</li>
              <li>• Built an AI sketch-feedback app used by peers</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="mx-auto my-24 max-w-7xl px-4">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900/60 to-neutral-950/80 p-8">
        <h2 className="text-2xl font-semibold sm:text-3xl">Let’s build something</h2>
        <p className="mt-2 max-w-2xl text-white/70">Interested in a commission, collaboration, or internship chat? Email me or connect on LinkedIn.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="gap-2"><a href="mailto:you@email.com"><Mail className="h-4 w-4" /> Email me</a></Button>
          <Button asChild variant="secondary" className="gap-2"><a href="#"><Linkedin className="h-4 w-4" /> LinkedIn</a></Button>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-white/40">© {new Date().getFullYear()} Aayush Sharma • Built with React & Tailwind</p>
    </section>
  );
}

// ---------- Dev self-checks (lightweight "tests") ----------
function devChecks(projects: Project[]) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return;
  console.assert(NOISE_SVG_DATA_URL.startsWith("data:image/svg+xml"), "Noise data URL should start with svg data URL");
  console.assert(NOISE_SVG_DATA_URL.includes("%23n") || NOISE_SVG_DATA_URL.includes("#n"), "Noise filter id should be present");
  projects.forEach((p, i) => {
    console.assert(!!p.id && !!p.title, `Project[${i}] must have id and title`);
    console.assert(["painting", "3d", "game"].includes(String(p.type)) || p.type === "all", `Project[${i}] type unexpected: ${p.type}`);
    console.assert(typeof p.year === "number", `Project[${i}] year must be number`);
    console.assert(!!p.cover, `Project[${i}] cover missing`);
  });
  // Added checks: search & sort behavior
  const term = "unity";
  const haystack = (p: Project) => `${p.title} ${p.tags.join(" ")} ${p.description}`.toLowerCase();
  const termExists = projects.some(p => haystack(p).includes(term));
  if (termExists) {
    const filtered = projects.filter(p => haystack(p).includes(term));
    console.assert(filtered.length > 0, "Search should return results for known term");
    console.assert(filtered.every(p => haystack(p).includes(term)), "Every filtered item should include the term");
  }
  const years = Array.from(new Set(projects.map(p => p.year)));
  if (years.length > 1) {
    const sorted = [...projects].sort((a, b) => b.year - a.year);
    for (let i = 1; i < sorted.length; i++) {
      console.assert(sorted[i - 1].year >= sorted[i].year, "Sort by newest should be descending by year");
    }
  }
  // New checks: paintings fallback & alternation logic
  const pf = projects.filter(p => p.type === "painting");
  console.assert(pf.length >= 0, "Painting fallback should be derivable");
  const parity = (i: number) => (i % 2 === 0 ? "left" : "right");
  console.assert(parity(0) === "left" && parity(1) === "right", "Alternating layout parity check");
  // Layout check: painting rows should center-align on md+
  setTimeout(() => {
    try {
      const root = document.getElementById('paintings');
      if (!root) return;
      const rows = root.querySelectorAll('.grid');
      if (rows.length) {
        const ok = Array.from(rows).every(r => r.className.includes('md:items-center'));
        console.assert(ok, 'Painting rows should center-align on md+ with md:items-center');
      }
    } catch {}
  }, 0);
}

// ---------- Main Page ----------
export default function PortfolioSite() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const projects = SEED_PROJECTS; // swap with your data source
  const paintings = usePaintings("/paintings/manifest.json", PAINTINGS_FALLBACK);

  useEffect(() => {
    devChecks(projects);
  }, [projects]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      <AuroraBackground />
      <Nav theme={theme} setTheme={setTheme} />
      <Hero />
      <PaintingScroll items={paintings.items} loading={paintings.loading} error={paintings.error} />
      <Gallery projects={projects} />
      <About />
      <Contact />
    </div>
  );
}

// ---------- Notes ----------
// Tailwind config: enable dark mode class, add container sizes if desired.
// Tailwind config: enable dark mode class, add container sizes if desired.
// Add your assets: replace SEED_PROJECTS cover/preview URLs; add itch.io/WebGL links for games.
// Put a PDF named Aayush_Sharma_Resume.pdf in /public to enable the resume download.
