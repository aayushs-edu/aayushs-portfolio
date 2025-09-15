"use client"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Trophy,
  ExternalLink,
  Github,
  Globe,
  Sparkles,
  Users,
  Clock,
  Palette,
  Stethoscope,
  Rocket,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  features: string[];
  technologies: string[];
  hackathon: string;
  duration: string;
  teamSize: number;
  year: string;
  award?: string;
  image: string;
  gallery?: string[];
  demoUrl?: string;
  githubUrl?: string;
  submissionUrl?: string;
  category: "Simulation" | "Web" | "Healthcare" | "Social Good";
  status: "Winner" | "Top 10" | "Finalist" | "Completed";
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}

const projects: Project[] = [
  {
    id: "exosky",
    title: "ExoVision",
    subtitle: "3D exoplanet star visualization",
    description: "An immersive 3D interactive star map of over 2000 exoplanets from NASA's database",
    longDescription: "ExoVision is a 3d Interactive Star Map for Exoplanets throughout the universe. Just select one of the 200 exoplanets in our database and gaze at the sky. ExoVision has the accurate distance, brightness, and color for all of its stars, creating an easy-to-use scientific tool for everyone.",
    features: [
      "Real-time 3D rendering of exoplanetary systems",
      "Interactive exoplanet views",
      "Accurate data from NASA Exoplanet Archive",
      "Over 2000 exoplanets and 5M stars visualized"
    ],
    technologies: [
      "Unity",
      "C#",
      "WebGL",
      "NASA Exoplanet API",
      "Python (Data Analysis)",
      "GitHub Pages"
    ],
    hackathon: "NASA Space Apps Challenge 2024",
    duration: "48 hours",
    teamSize: 4,
    year: "2024",
    image: "/images/exosky-cover.jpg",
    gallery: [
      "/images/exosky-cover.jpg",
      "/images/exosky-1.jpg",
      "/images/exosky-2.jpg"
    ],
    demoUrl: "https://mijosexoskydemo.github.io",
    githubUrl: "https://github.com/mijosexoskydemo/mijosexoskydemo.github.io",
    submissionUrl: "https://www.spaceappschallenge.org/nasa-space-apps-2024/find-a-team/the-mijos/?tab=project",
    category: "Simulation",
    status: "Completed",
    accent: "from-blue-500 via-purple-500 to-pink-500",
    icon: Globe
  },
  {
    id: "lumina",
    title: "Lumina",
    subtitle: "Shedding Light on Hidden Inequalities",
    description: "Lumina is a platform dedicated to illuminating hidden inequalities and sharing stories of marginalized communities.",
    longDescription: "Lumina is a platform dedicated to illuminating hidden inequalities and sharing stories of marginalized communities. Our goal is to bring awareness, spark dialogue, and empower individuals to create change.",
    features: [
      "Authentic stories from marginalized voices",
      "Inequality Atlas",
      "Inclusive Forum with Theme Tagging",
      "Instagram integration for sharing stories",
      "LuminaLens: AI-powered policy generation",
      "Stunning visuals and UI"
    ],
    technologies: [
      "Flutter",
      "Flask",
      "Firebase",
      "OpenAI GPT-4",
      "Python (Data Analysis)",
    ],
    hackathon: "GNEC Hackathon 2025",
    duration: "1.5 months",
    teamSize: 2,
    year: "2025",
    image: "/images/lumina-cover.jpg",
    gallery: [
      "/images/lumina-cover.jpg",
      "/images/lumina-1.jpg",
      "/images/lumina-2.jpg",
      "/images/lumina-3.jpg"
    ],
    demoUrl: "https://luminadev.netlify.app",
    githubUrl: "https://github.com/aayushs-edu/lumina",
    submissionUrl: "https://devpost.com/software/lumina-ivry7c",
    category: "Social Good",
    status: "Top 10",
    accent: "from-yellow-400 via-orange-500 to-red-500",
    icon: Palette
  },
  {
    id: "medai",
    title: "MedAI",
    subtitle: "AI doctor for diagnosis and consultation",
    description: "An AI chatbot powered by ML to diagnose disease and give advice based on text/image input.",
    longDescription: "MedAI democratizes access to early disease detection by putting an intelligent AI doctor in your pocket. Our Naive-Bayes model has an 85% accuracy in describing the disease as its top three predictions. Our zero-shot model has an almost 93% accuracy in describing the given image.",
    features: [
      "Image classification",
      "Multi-disease Naive Bayes model",
      "GPT-powered response formation",
      "Realistic conversations"
    ],
    technologies: [
      "TensorFlow",
      "One-Shot Image Classification",
      "Machine Learning",
      "Python",
      "Javascript",
      "OpenAI GPT-4 API",
    ],
    hackathon: "GNEC Hackathon 2024",
    duration: "1 month",
    teamSize: 4,
    year: "2024",
    image: "/images/medai-cover.jpg",
    gallery: [
      "/images/medai-cover.jpg",
      "/images/medai-1.jpg",
      "/images/medai-2.jpg"
    ],
    demoUrl: "https://medai24.netlify.app",
    githubUrl: "https://github.com/aayushs-edu/MedAI",
    submissionUrl: "https://devpost.com/software/medai-ftinjx",
    category: "Healthcare",
    status: "Completed",
    accent: "from-green-400 via-emerald-500 to-teal-500",
    icon: Stethoscope
  }
];

function ProjectCard({ project, index, onSelect, activeDemoId, setActiveDemoId }: {
  project: Project;
  index: number;
  onSelect: () => void;
  activeDemoId: string | null;
  setActiveDemoId: (id: string | null) => void;
}) {
  const Icon = project.icon;
  const [isLoading, setIsLoading] = useState(false);
  const isDemoActive = activeDemoId === project.id;

  const handleLaunchDemo = () => {
    // Close any other active demo
    if (activeDemoId && activeDemoId !== project.id) {
      setActiveDemoId(null);
      setTimeout(() => {
        setActiveDemoId(project.id);
        setIsLoading(true);
      }, 100);
    } else {
      setActiveDemoId(project.id);
      setIsLoading(true);
    }
  };

  const handleCloseDemo = () => {
    setActiveDemoId(null);
    setIsLoading(false);
  };

  // Auto-hide loader after a timeout
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group pointer-events-auto"
    >
      <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-800/60 to-neutral-900/80 backdrop-blur-lg hover:border-white/30 transition-all duration-300 pointer-events-auto">
        <div className={`absolute inset-0 bg-gradient-to-br ${project.accent} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

        {/* Header with badges */}
        <CardHeader className="relative p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${project.accent} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{project.title}</h3>
                  <p className={`text-sm font-medium bg-gradient-to-r ${project.accent} bg-clip-text text-transparent`}>
                    {project.subtitle}
                  </p>
                </div>
              </div>
              <p className="text-white/80 mt-2 text-sm max-w-3xl">
                {project.description}
              </p>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-1.5 lg:items-end">
              {project.status === "Winner" && project.award && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold shadow-lg text-xs">
                  <Trophy className="mr-1 h-3 w-3" />
                  {project.award}
                </Badge>
              )}
              <Badge className="bg-purple-500/20 border border-purple-400/50 text-purple-300 text-xs font-medium">
                <Code className="mr-1 h-3 w-3" />
                {project.hackathon}
              </Badge>
              <Badge className={`border ${project.category === 'Simulation' ? 'bg-blue-500/20 border-blue-400/50 text-blue-300' : project.category === 'Healthcare' ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : project.category === 'Social Good' ? 'bg-pink-500/20 border-pink-400/50 text-pink-300' : 'bg-orange-500/20 border-orange-400/50 text-orange-300'} text-xs font-medium`}>
                {project.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {project.duration}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="mr-1 h-3 w-3" />
                Team of {project.teamSize}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Embedded Website */}
        <CardContent className="px-4 pb-4">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-white/10 bg-black mb-4">
            {!isDemoActive ? (
              /* Launch Panel */
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                <div className="text-center space-y-4">
                  <div className={`mx-auto h-16 w-16 rounded-full bg-gradient-to-r ${project.accent} flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{project.title} Demo</h3>
                    <p className="text-sm text-white/60 mb-4">Click to launch interactive preview</p>
                  </div>
                  <Button
                    onClick={handleLaunchDemo}
                    className={`bg-gradient-to-r ${project.accent} hover:opacity-90`}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Launch Demo
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 z-10">
                    <div className="text-center">
                      <Icon className="h-12 w-12 text-white/30 mb-2 mx-auto animate-pulse" />
                      <p className="text-sm text-white/50">Loading {project.title}...</p>
                    </div>
                  </div>
                )}
                {/* Iframe */}
                <iframe
                  src={project.demoUrl}
                  className={`h-full w-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
                  title={`${project.title} Preview`}
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                {/* Instructions for ExoVision */}
                {project.id === "exosky" && !isLoading && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-lg">
                    <div className="bg-black/90 backdrop-blur-lg rounded-lg px-4 py-3 border border-white/20 shadow-lg">
                      <div className="space-y-1">
                        <p className="text-white text-sm font-semibold mb-2 text-center">ExoVision Controls</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                          <div className="flex items-center gap-1.5">
                            <kbd className="px-2 py-0.5 text-xs font-semibold text-white bg-white/20 rounded border border-white/30">E</kbd>
                            <span className="text-white/90 text-xs">Interact</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <kbd className="px-2 py-0.5 text-xs font-semibold text-white bg-white/20 rounded border border-white/30">Mouse</kbd>
                            <span className="text-white/90 text-xs">Look Around</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <kbd className="px-2 py-0.5 text-xs font-semibold text-white bg-white/20 rounded border border-white/30">Right Click</kbd>
                            <span className="text-white/90 text-xs">Interact UI</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Close button */}
                <div className="absolute top-2 right-2 flex gap-2 z-20">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-black/80 backdrop-blur hover:bg-black/90"
                    onClick={handleCloseDemo}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 relative z-10">
            <Button
              asChild
              size="sm"
              className={`bg-gradient-to-r ${project.accent} hover:opacity-90 cursor-pointer`}
            >
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                <Rocket className="mr-1.5 h-3.5 w-3.5" />
                Open Full Site
              </a>
            </Button>
            {project.submissionUrl && (
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="cursor-pointer"
              >
                <a href={project.submissionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                  <Trophy className="mr-1.5 h-3.5 w-3.5" />
                  Submission
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onSelect}
              type="button"
              className="cursor-pointer"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Details
            </Button>
            {project.githubUrl && (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="cursor-pointer"
              >
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                  <Github className="mr-1.5 h-3.5 w-3.5" />
                  Code
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectModal({ project, isOpen, onClose }: { project: Project | null; isOpen: boolean; onClose: () => void }) {
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto bg-gradient-to-br from-neutral-950/95 via-neutral-900/95 to-neutral-950/95 backdrop-blur-2xl border border-white/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${project.accent} flex items-center justify-center`}>
                <project.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{project.title}</h2>
                <p className="text-sm text-white/70">{project.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.award && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black">
                  <Trophy className="mr-1 h-3 w-3" />
                  {project.award}
                </Badge>
              )}
              <Badge variant="outline">{project.hackathon}</Badge>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                {project.duration}
              </Badge>
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                Team of {project.teamSize}
              </Badge>
            </div>
          </div>

          

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <p className="text-white/90 leading-relaxed">{project.longDescription}</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Key Features</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {project.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <Sparkles className={`h-4 w-4 mt-0.5 text-transparent bg-gradient-to-r ${project.accent} bg-clip-text`} />
                  <span className="text-sm text-white/90">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Technologies Used</h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            {project.demoUrl && (
              <Button asChild className={`bg-gradient-to-r ${project.accent}`}>
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Live Demo
                </a>
              </Button>
            )}
            {project.submissionUrl && (
              <Button asChild variant="secondary">
                <a href={project.submissionUrl} target="_blank" rel="noopener noreferrer">
                  <Trophy className="mr-2 h-4 w-4" />
                  View Submission
                </a>
              </Button>
            )}
            {project.githubUrl && (
              <Button asChild variant="outline">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View Source Code
                </a>
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default function HackathonsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);

  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const stats = [
    {
      icon: Clock,
      value: "200+",
      label: "Hours of Hacking",
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/30"
    },
    {
      icon: Code,
      value: "50K+",
      label: "Lines of Code",
      gradient: "from-green-500 to-emerald-500",
      shadow: "shadow-green-500/30"
    },
    {
      icon: Trophy,
      value: "3",
      label: "Hackathons",
      gradient: "from-yellow-400 to-amber-500",
      shadow: "shadow-yellow-400/30"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="absolute inset-0 backdrop-blur-[1px]" />
      </div>
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-950 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-0.5"
          >
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black">
              <Code className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold mb-4 pb-1 leading-normal bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Hackathon Projects
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            24-48 hour sprints building innovative solutions. From AI applications to healthcare tools,
            each project represents intense collaboration and creative problem-solving.
          </p>
        </motion.div>

        {/* Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 grid gap-4 grid-cols-3 max-w-2xl mx-auto"
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

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-8">Projects</h2>
          <div className="space-y-8">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onSelect={() => openProjectModal(project)}
                activeDemoId={activeDemoId}
                setActiveDemoId={setActiveDemoId}
              />
            ))}
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-12">
            <Rocket className="mx-auto mb-4 h-12 w-12 text-purple-400" />
            <h3 className="text-2xl font-bold mb-3">More Projects Coming Soon</h3>
            <p className="text-white/70 max-w-2xl mx-auto mb-6">
              Currently documenting more hackathon projects including AR/VR experiments,
              blockchain applications, and IoT solutions.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="secondary">
                <a href="https://github.com/aayushs-edu" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View GitHub
                </a>
              </Button>
              <Button asChild>
                <a href="https://devpost.com/aayushs2008" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Devpost Profile
                </a>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
