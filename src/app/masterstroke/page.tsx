"use client"
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Palette,
  Clock,
  Calendar,
  ChevronRight,
  ArrowRight,
  Cpu,
  Eye,
  Lightbulb,
  Target,
  Brush,
  Camera,
  Zap,
  BookOpen,
  Star,
  Users,
  Code,
  X,
  Layers,
  Box,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: "Development" | "AI Research" | "Art Theory" | "Update";
  featured: boolean;
  image?: string;
  tags: string[];
}

const blogPosts: BlogPost[] = [
  {
    id: "intro-masterstroke",
    title: "Introducing MasterStroke AI",
    subtitle: "Revolutionizing Art Education with AI",
    excerpt: "Learn about the vision behind MasterStroke AI and how we're using computer vision to democratize art education.",
    content: `# Introducing MasterStroke AI

## The Vision

MasterStroke AI was born from a simple observation: millions of aspiring artists around the world lack access to quality art education and personalized feedback. Traditional art education is expensive, time-consuming, and often inaccessible to many who wish to pursue their artistic passions.

## How It Works

Our platform leverages cutting-edge computer vision and machine learning algorithms to analyze artwork in real-time. When you upload a sketch or painting, MasterStroke AI:

1. **Analyzes Composition** - Evaluates the rule of thirds, golden ratio, and visual balance
2. **Assesses Values** - Examines light, shadow, and contrast relationships
3. **Reviews Technique** - Identifies brush strokes, line quality, and medium usage
4. **Provides Feedback** - Generates constructive, actionable advice for improvement

## The Technology Stack

We're building MasterStroke on a robust foundation:
- **TensorFlow & PyTorch** for deep learning models
- **OpenCV** for image processing
- **Custom CNN architectures** trained on millions of artwork samples
- **React & Next.js** for a seamless user experience

## What's Next

We're currently in closed beta with a select group of art students and educators. The feedback has been overwhelmingly positive, with users reporting significant improvements in their artwork after just a few weeks of using the platform.

Stay tuned for our public launch announcement!`,
    date: "January 15, 2025",
    readTime: "5 min read",
    category: "Update",
    featured: true,
    tags: ["AI", "Computer Vision", "Art Education", "Launch"]
  },
  {
    id: "cv-techniques",
    title: "Computer Vision Techniques for Art Analysis",
    subtitle: "Deep dive into our technical approach",
    excerpt: "Exploring the computer vision algorithms and neural networks powering MasterStroke's art analysis capabilities.",
    content: `# Computer Vision Techniques for Art Analysis

## The Challenge

Analyzing art is fundamentally different from typical computer vision tasks. While object detection focuses on identifying "what" is in an image, art analysis must understand "how well" something is executed - a much more subjective and nuanced challenge.

## Our Approach

### 1. Multi-Scale Feature Extraction

We use a modified ResNet-152 architecture with attention mechanisms to extract features at multiple scales:
- **Global features** for overall composition
- **Regional features** for focal points and balance
- **Local features** for technique and detail work

### 2. Style Transfer Networks

By leveraging style transfer techniques, we can:
- Separate content from style
- Compare user artwork against master references
- Identify areas where technique could be improved

### 3. Custom Loss Functions

We've developed specialized loss functions that consider:
- Artistic principles (golden ratio, rule of thirds)
- Historical art movements and their characteristics
- Medium-specific techniques (oil, watercolor, pencil)

## Training Data

Our models are trained on:
- 2.5 million artwork samples from museums worldwide
- 500,000 student artworks with instructor annotations
- Synthetic data generated through style transfer

## Results

Early testing shows:
- 89% accuracy in identifying composition issues
- 92% agreement with human art instructors on major feedback points
- 3.2x improvement in student artwork scores after 30 days

The journey to democratize art education continues!`,
    date: "January 12, 2025",
    readTime: "8 min read",
    category: "AI Research",
    featured: false,
    tags: ["Computer Vision", "Deep Learning", "ResNet", "Technical"]
  },
  {
    id: "beta-launch",
    title: "MasterStroke Beta: What We Learned",
    subtitle: "Insights from our closed beta program",
    excerpt: "Key learnings from 500+ beta testers and how their feedback is shaping the future of MasterStroke AI.",
    content: `# MasterStroke Beta: What We Learned

## The Numbers

Our closed beta launched with:
- **500+ beta testers** from 42 countries
- **15,000+ artworks** analyzed
- **50,000+ feedback sessions** generated
- **4.8/5 average rating** from users

## Key Insights

### What Users Love

1. **Instant Feedback** - No more waiting days for instructor reviews
2. **Non-Judgmental** - AI provides objective, constructive criticism
3. **Available 24/7** - Practice and improve on your schedule
4. **Progress Tracking** - Visual timeline of improvement over time

### Areas for Improvement

Based on user feedback, we're working on:
- Supporting more art mediums (sculpture, digital art)
- Adding collaborative features for art communities
- Implementing style-specific feedback modes
- Creating guided tutorials based on identified weaknesses

## Success Stories

*"MasterStroke helped me finally understand values in my paintings. My work has improved dramatically!"* - Sarah, Beta Tester

*"As an art teacher, I use MasterStroke to provide additional support to my students outside class hours."* - Michael, Art Educator

## What's Next

The public launch is scheduled for Q2 2025 with:
- Expanded medium support
- Mobile app for on-the-go feedback
- Integration with popular art platforms
- Tiered pricing for students and professionals`,
    date: "January 10, 2025",
    readTime: "6 min read",
    category: "Update",
    featured: true,
    tags: ["Beta", "User Feedback", "Product Development"]
  },
  {
    id: "art-theory-ai",
    title: "Bridging Art Theory and AI",
    subtitle: "How we encode artistic principles",
    excerpt: "The challenge of teaching machines to understand subjective artistic concepts and aesthetic principles.",
    content: `# Bridging Art Theory and AI

## The Subjective Nature of Art

One of our biggest challenges has been encoding subjective artistic principles into objective algorithms. How do you teach a machine about "good" composition when even human experts disagree?

## Our Solution: Consensus Learning

Instead of defining rigid rules, we use consensus learning:
1. Multiple art experts annotate the same pieces
2. We identify areas of agreement and disagreement
3. The AI learns to recognize patterns in consensus
4. Confidence scores reflect the degree of subjectivity

## Encoded Principles

### Composition Rules
- Rule of thirds
- Golden ratio
- Leading lines
- Visual hierarchy
- Balance and symmetry

### Value Systems
- Light source consistency
- Contrast ratios
- Atmospheric perspective
- Form modeling

### Color Theory
- Complementary schemes
- Temperature relationships
- Saturation balance
- Mood associations

## The Human Touch

While AI can identify technical issues, we always emphasize that art is ultimately about human expression. MasterStroke AI is a tool to help artists improve their technical skills, not replace their creative vision.

The goal is augmentation, not automation - helping artists express their vision more effectively.`,
    date: "January 8, 2025",
    readTime: "7 min read",
    category: "Art Theory",
    featured: false,
    tags: ["Art Theory", "Machine Learning", "Philosophy"]
  }
];

function BlogCard({ post, onSelect }: { post: BlogPost; onSelect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group cursor-pointer border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-800/60 to-neutral-900/80 backdrop-blur-lg hover:border-orange-500/30 transition-all duration-300" onClick={onSelect}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {post.featured && (
                <Badge className="mb-2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              <h3 className="text-xl font-bold mb-1 group-hover:text-orange-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-orange-400/80 mb-2">{post.subtitle}</p>
              <div className="flex items-center gap-3 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
                <Badge variant="outline" className="text-xs">
                  {post.category}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-white/70 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="group-hover:text-orange-400">
              Read More
              <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BlogModal({ post, isOpen, onClose }: { post: BlogPost | null; isOpen: boolean; onClose: () => void }) {
  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto bg-gradient-to-br from-neutral-950/95 via-neutral-900/95 to-neutral-950/95 backdrop-blur-2xl border border-white/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              {post.featured && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline">{post.category}</Badge>
            </div>
            <h2 className="text-3xl font-bold mb-2">{post.title}</h2>
            <p className="text-lg text-orange-400/80 mb-3">{post.subtitle}</p>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            {post.content.split('\n\n').map((paragraph, i) => {
              if (paragraph.startsWith('#')) {
                const level = paragraph.match(/^#+/)?.[0].length || 1;
                const text = paragraph.replace(/^#+\s/, '');
                const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
                return <HeadingTag key={i} className={`font-bold ${level === 1 ? 'text-2xl mb-4' : level === 2 ? 'text-xl mb-3 mt-6' : 'text-lg mb-2 mt-4'}`}>{text}</HeadingTag>;
              }
              if (paragraph.match(/^\d\./)) {
                return (
                  <ol key={i} className="list-decimal list-inside space-y-2 my-4">
                    {paragraph.split('\n').map((item, j) => (
                      <li key={j} className="text-white/80">
                        {item.replace(/^\d\.\s\*\*(.+?)\*\*/, '$1').replace(/^\d\.\s/, '')}
                      </li>
                    ))}
                  </ol>
                );
              }
              if (paragraph.startsWith('-')) {
                return (
                  <ul key={i} className="list-disc list-inside space-y-2 my-4">
                    {paragraph.split('\n').map((item, j) => (
                      <li key={j} className="text-white/80">
                        {item.replace(/^-\s\*\*(.+?)\*\*/, '$1').replace(/^-\s/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.startsWith('*"')) {
                return (
                  <blockquote key={i} className="border-l-4 border-orange-500 pl-4 my-4 italic text-white/70">
                    {paragraph.replace(/\*/g, '')}
                  </blockquote>
                );
              }
              return <p key={i} className="text-white/80 leading-relaxed my-4">{paragraph}</p>;
            })}
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {post.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default function MasterStrokePage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openBlogModal = (post: BlogPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const features = [
    {
      icon: Eye,
      title: "Real-time Analysis",
      description: "Instant feedback on composition, values, and technique"
    },
    {
      icon: Cpu,
      title: "AI-Powered",
      description: "Advanced computer vision and deep learning models"
    },
    {
      icon: Target,
      title: "Personalized Learning",
      description: "Adaptive feedback based on skill level and goals"
    },
    {
      icon: Brush,
      title: "Multi-Medium Support",
      description: "Works with pencil, paint, digital art, and more"
    },
    {
      icon: Lightbulb,
      title: "Actionable Insights",
      description: "Specific suggestions for improvement"
    },
    {
      icon: Camera,
      title: "Progress Tracking",
      description: "Visual timeline of your artistic journey"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white [color-scheme:dark]">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-red-900/10 to-purple-900/20" />
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
            className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-500 p-1"
          >
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/90">
              <Palette className="h-8 w-8 text-white" />
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 pb-1 leading-tight bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
            MasterStroke AI
          </h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing art education with AI-powered feedback and personalized learning paths
          </p>
        </motion.div>

        {/* Algorithm Progression Visual - Epic Version */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-24 relative"
        >
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-purple-500/10 px-5 py-2.5 backdrop-blur-xl"
            >
              <Activity className="h-5 w-5 text-orange-400 animate-pulse" />
              <span className="text-sm font-bold text-transparent bg-gradient-to-r from-orange-300 via-red-300 to-purple-300 bg-clip-text uppercase tracking-wider">
                AI Pipeline Visualization
              </span>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/60 max-w-4xl mx-auto leading-relaxed"
            >
            </motion.p>
          </div>

          <div className="relative">
            {/* Epic gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-purple-500/5 rounded-3xl blur-3xl" />

            {/* Animated connection line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="absolute top-1/2 left-10 right-10 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-purple-500 -translate-y-1/2 hidden lg:block rounded-full"
              style={{ transformOrigin: "left center" }}
            />

            {/* Glowing dots on the line */}
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + i * 0.2, type: "spring" }}
                className="absolute top-1/2 -translate-y-1/2 hidden lg:block"
                style={{ left: `${20 + i * 15}%` }}
              >
                <div className="h-4 w-4 rounded-full bg-white shadow-2xl shadow-white/50 animate-pulse" />
              </motion.div>
            ))}

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 relative z-10">
              {[
                {
                  title: "Original Painting",
                  subtitle: "Your Artwork",
                  image: "/images/masterstroke-1.png",
                  icon: Palette,
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  title: "SAM2.1 Segmentation",
                  subtitle: "Object Detection",
                  image: "/images/masterstroke-2.png",
                  icon: Eye,
                  color: "from-green-500 to-emerald-500"
                },
                {
                  title: "Value Block-in",
                  subtitle: "Block in large shapes",
                  image: "/images/masterstroke-3.png",
                  icon: Layers,
                  color: "from-purple-500 to-pink-500"
                },
                {
                  title: "PidiNet Edges",
                  subtitle: "Probability Edge Map",
                  image: "/images/masterstroke-4.png",
                  icon: Box,
                  color: "from-orange-500 to-red-500"
                },
                {
                  title: "Pencil Sketch",
                  subtitle: "Foundation Analysis",
                  image: "/images/masterstroke-5.png",
                  icon: Brush,
                  color: "from-yellow-500 to-amber-500"
                }
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: i * 0.2,
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="relative group"
                  >
                    {/* Glow effect behind card */}
                    <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${step.color} opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-40`} />

                    {/* Step number badge */}
                    <div className="absolute -top-4 -left-4 z-20">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 0.3 + i * 0.2,
                          type: "spring",
                          stiffness: 200
                        }}
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-2xl border-2 border-white/20`}
                      >
                        {i + 1}
                      </motion.div>
                    </div>

                    <Card className="relative h-full border-0 bg-gradient-to-br from-neutral-900/95 via-neutral-900/80 to-neutral-950/95 backdrop-blur-xl transition-all duration-500 overflow-hidden rounded-3xl hover:shadow-2xl hover:-translate-y-2">
                      {/* Animated gradient overlay */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${step.color} transition-opacity duration-700`}
                        animate={{ opacity: i === 2 ? 0.05 : 0.03 }}
                        whileHover={{ opacity: 0.1 }}
                      />

                      {/* Image Container */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-black/20 to-black/60">
                        <motion.img
                          src={step.image}
                          alt={step.title}
                          className="h-full w-full object-cover"
                          initial={{ scale: 1.2, filter: "blur(10px)" }}
                          whileInView={{ scale: 1, filter: "blur(0px)" }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.2, duration: 0.8 }}
                          whileHover={{ scale: 1.05 }}
                        />

                        {/* Gradient overlays for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                        {/* Icon badge */}
                        <motion.div
                          className="absolute top-4 right-4"
                          initial={{ scale: 0, rotate: -90 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{
                          delay: 0.5 + i * 0.2,
                          type: "spring",
                          stiffness: 200
                          }}
                          whileHover={{ scale: 1.1, rotate: 10 }}
                        >
                          <div className={`h-7 w-7 rounded-xl bg-gradient-to-br ${step.color} p-1.5 shadow-2xl backdrop-blur-md border border-white/20`}>
                          <Icon className="h-full w-full text-white drop-shadow-lg" />
                          </div>
                        </motion.div>

                        {/* Step label */}
                        <div className="absolute bottom-4 left-4">
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 + i * 0.2 }}
                            className="inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10"
                          >
                            <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${step.color} animate-pulse`} />
                            <span className="text-xs font-medium text-white/80">Step {i + 1}</span>
                          </motion.div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-6">
                        <motion.h3
                          initial={{ y: 10, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.7 + i * 0.2 }}
                          className="font-bold text-lg text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 group-hover:bg-clip-text transition-all"
                        >
                          {step.title}
                        </motion.h3>
                        <motion.p
                          initial={{ y: 10, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.8 + i * 0.2 }}
                          className={`text-sm font-medium bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                        >
                          {step.subtitle}
                        </motion.p>
                      </CardContent>
                    </Card>

                    {/* Epic arrow connector */}
                    {i < 4 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0, x: -20 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 0.5 + i * 0.2,
                          type: "spring",
                          stiffness: 100
                        }}
                        className="absolute top-1/2 -right-8 -translate-y-1/2 hidden lg:flex items-center z-30"
                      >
                        <div className="relative">
                          <ChevronRight className="h-10 w-10 text-white/30" />
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.3
                            }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <ChevronRight className={`h-10 w-10 text-transparent bg-gradient-to-r ${step.color} bg-clip-text`} />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Result indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-10 text-center"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-6 py-3 backdrop-blur-sm">
                <Activity className="h-5 w-5 text-green-400 animate-pulse" />
                <span className="text-sm font-medium text-green-300">
                  Real-time AI Analysis & Personalized Feedback
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Blog Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-3">Development Blog</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Follow our journey as we build the future of AI-powered art education.
              Technical deep-dives, progress updates, and insights from our research.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {blogPosts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onSelect={() => openBlogModal(post)}
              />
            ))}
          </div>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Key Features</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-white/10 bg-white/5 hover:bg-white/10 transition-all group">
                  <CardContent className="p-6">
                    <div className="mb-3 h-12 w-12 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 to-red-500/10 px-8 py-8">
            <Brain className="mx-auto mb-4 h-12 w-12 text-orange-400" />
            <h3 className="text-2xl font-bold mb-3">Art Education Redefined</h3>
            <p className="text-white/70 max-w-2xl mx-auto mb-6">
              MasterStroke AI is currently in development. Email me to learn more!
            </p>
            <div className="flex justify-center gap-4">
              <Button
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90"
          asChild
              >
          <a href="mailto:aayushs2008@gmail.com?subject=MasterStroke%20AI%20Interest" target="_blank" rel="noopener noreferrer">
            <Sparkles className="mr-2 h-4 w-4" />
            Request Early Access
          </a>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Blog Modal */}
      <BlogModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}