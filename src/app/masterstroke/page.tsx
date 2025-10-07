"use client"
import React, { JSX, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Palette,
  Clock,
  Calendar,
  ChevronRight,
  Cpu,
  Eye,
  Lightbulb,
  Target,
  Brush,
  Camera,
  Star,
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
    id: "bridging-art-ai",
    title: "The Idea: Bridging Art and AI",
    subtitle: "🎨✏️ What if a machine could teach you how to draw like a true artist?",
    excerpt: "We've all seen them, we've all tried them. YouTube tutorials were never enough. Now, with cutting-edge AI, we're building something that understands art the way artists do - from primitive shapes to final forms.",
    content: `# The Idea: Bridging Art and AI

## 🎨✏️ What if a machine could teach you how to draw like a true artist?

[IMAGE: /images/masterstroke-blog1-1.webp]

We've all seen them, we've all tried them. If you ever wanted to learn how to draw, YouTube was the place to go. But following along with those videos was not actually teaching you anything. And good art teachers are not always available or affordable. With the newest AI technology, I knew that this problem could be solved: a model that generates steps on how to draw a piece like a real artist, from primitive shapes to final forms. For each step, it will give feedback to the user by analyzing proportions, perspective, lighting, etc.

[GIF: /images/masterstroke-blog1-4.gif]

## The Ambitious Vision

At first glance, this seems very ambitious. How can AI critique art? How does AI know how artwork is constructed, step by step? The truth is, most AI systems today are built to generate end results. You give them a prompt, they give you a polished image. But artists don't work that way. The real magic of drawing happens in the in-between stages:
- **The faint circles** that map out a head
- **The blocky forms** that give volume to a still life
- **The careful shading** that transforms flat lines into depth.
If we want AI to truly teach art, it has to understand these steps—not just the destination.

[GIF: /images/masterstroke-blog1-3.gif]

## Breaking New Ground in AI Research

Recently, many have made breakthroughs in this niche area of machine learning. **Inverse Painting** explored the idea of reversing a finished artwork back into earlier stages, almost like peeling away layers of paint to reveal the sketch underneath.

[IMAGE: /images/masterstroke-blog1-6.png]

Meanwhile, **DeepPrimitive** showed that even the most detailed images can be simplified into a small set of basic shapes—circles, rectangles, and lines—just like the first steps an art teacher would show a beginner.

[IMAGE_PLACEHOLDER: DeepPrimitive examples showing complex art broken into primitives]

## What Makes This Different

Traditional AI art tools:
- Generate finished pieces instantly
- Skip the learning process
- Can't explain their decisions
- Don't understand construction

MasterStroke AI:
- Understands artistic process
- Teaches through stages
- Provides constructive feedback
- Builds fundamental skills

[GIF_PLACEHOLDER: Side-by-side comparison of traditional AI vs MasterStroke approach]

## The Journey Ahead

This is just the beginning. We're not just building another AI tool - we're creating an AI teacher that understands art the way humans do. Stay tuned as we dive deeper into the technology making this possible.

[IMAGE_PLACEHOLDER: Roadmap visualization or future vision artwork]`,
    date: "June 15, 2025",
    readTime: "5 min read",
    category: "AI Research",
    featured: true,
    tags: ["AI", "Computer Vision", "Art Education", "Machine Learning", "DeepPrimitive", "Inverse Painting"]
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
      className="h-full"
    >
      <Card className="h-full group cursor-pointer border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-800/60 to-neutral-900/80 backdrop-blur-lg hover:border-orange-500/30 transition-all duration-300" onClick={onSelect}>
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
      <DialogContent className="!max-w-[85vw] w-[85vw] max-h-[90vh] overflow-hidden bg-gradient-to-br from-neutral-950/95 via-neutral-900/95 to-neutral-950/95 backdrop-blur-2xl border border-white/20 sm:!max-w-[85vw]">
        {/* Side decorative elements */}
        <div className="absolute left-0 top-0 bottom-0 w-32 lg:w-48 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent" />
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -left-20 top-20 opacity-20"
          >
            <Palette className="h-32 w-32 text-orange-400" />
          </motion.div>
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute -left-16 bottom-32 opacity-20"
          >
            <Brush className="h-24 w-24 text-purple-400" />
          </motion.div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-32 lg:w-48 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-purple-500/10 via-transparent to-transparent" />
          <motion.div
            animate={{
              y: [0, 30, 0],
              rotate: [0, -8, 0]
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute -right-16 top-40 opacity-20"
          >
            <Brain className="h-28 w-28 text-red-400" />
          </motion.div>
          <motion.div
            animate={{
              y: [0, -25, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 9, repeat: Infinity, delay: 2 }}
            className="absolute -right-20 bottom-20 opacity-20"
          >
            <Sparkles className="h-32 w-32 text-purple-400" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-7xl mx-auto px-8 lg:px-20 py-8 max-h-[85vh] overflow-y-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gradient-to-b
            [&::-webkit-scrollbar-thumb]:from-orange-500/20
            [&::-webkit-scrollbar-thumb]:via-red-500/20
            [&::-webkit-scrollbar-thumb]:to-purple-500/20
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:border
            [&::-webkit-scrollbar-thumb]:border-white/10
            hover:[&::-webkit-scrollbar-thumb]:from-orange-500/40
            hover:[&::-webkit-scrollbar-thumb]:via-red-500/40
            hover:[&::-webkit-scrollbar-thumb]:to-purple-500/40"
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {post.featured && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline">{post.category}</Badge>
            </div>
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

          <div className="prose prose-invert max-w-none lg:prose-lg">
            {(() => {
              let imageCounter = 0;
              const elements: (JSX.Element | null)[] = [];
              const paragraphs = post.content.split('\n\n');

              for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i];

                // Handle images (both placeholders and actual images) with side-by-side layout
                if (paragraph.startsWith('[IMAGE_PLACEHOLDER:') || paragraph.startsWith('[IMAGE:')) {
                  const isPlaceholder = paragraph.startsWith('[IMAGE_PLACEHOLDER:');
                  const description = paragraph.match(/\[IMAGE_PLACEHOLDER:\s*(.+?)\]/)?.[1] || '';
                  const imagePath = paragraph.match(/\[IMAGE:\s*(.+?)\]/)?.[1] || '';
                  const isEven = imageCounter % 2 === 0;
                  imageCounter++;

                  // Collect the next text content until we hit another image/gif or run out
                  const textContent: string[] = [];
                  let j = i + 1;
                  while (j < paragraphs.length &&
                         !paragraphs[j].startsWith('[IMAGE_PLACEHOLDER:') &&
                         !paragraphs[j].startsWith('[IMAGE:') &&
                         !paragraphs[j].startsWith('[GIF_PLACEHOLDER:') &&
                         !paragraphs[j].startsWith('[GIF:')) {
                    textContent.push(paragraphs[j]);
                    j++;
                  }

                  elements.push(
                    <motion.div
                      key={`img-${i}`}
                      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className={`my-12 grid lg:grid-cols-2 gap-8 items-center ${isEven ? '' : 'lg:direction-rtl'}`}
                    >
                      <div className={`${isEven ? '' : 'lg:order-2'}`}>
                        <div className="relative rounded-2xl overflow-hidden border border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-purple-500/5">
                          {isPlaceholder ? (
                            <div className={`${imageCounter === 1 ? 'aspect-[21/9]' : imageCounter === 3 ? 'aspect-[16/9]' : imageCounter === 4 ? 'aspect-square' : 'aspect-[4/3]'} flex items-center justify-center`}>
                              <div className="text-center p-8">
                                <Camera className="h-12 w-12 mx-auto mb-4 text-orange-400/50" />
                                <p className="text-sm text-orange-400/70 font-medium">Image placeholder</p>
                                <p className="text-xs text-white/40 mt-2">{description}</p>
                              </div>
                            </div>
                          ) : (
                            <motion.img
                              src={imagePath}
                              alt="Blog illustration"
                              className={`w-full h-full object-cover ${imageCounter === 1 ? 'aspect-[21/9]' : imageCounter === 3 ? 'aspect-[16/9]' : imageCounter === 4 ? 'aspect-square' : 'aspect-[4/3]'}`}
                              initial={{ scale: 1.1, filter: "blur(5px)" }}
                              whileInView={{ scale: 1, filter: "blur(0px)" }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/50 to-transparent pointer-events-none" />
                        </div>
                      </div>
                      <div className={`space-y-4 ${isEven ? '' : 'lg:order-1 lg:text-right'}`}>
                        {textContent.slice(0, 2).map((text, idx) =>
                          renderParagraph(text, `${i}-text-${idx}`)
                        )}
                      </div>
                    </motion.div>
                  );

                  // Skip the paragraphs we just consumed
                  i = j - 1;
                  continue;
                }

                // Handle GIFs (both placeholders and actual GIFs) with side-by-side layout
                if (paragraph.startsWith('[GIF_PLACEHOLDER:') || paragraph.startsWith('[GIF:')) {
                  const isPlaceholder = paragraph.startsWith('[GIF_PLACEHOLDER:');
                  const description = paragraph.match(/\[GIF_PLACEHOLDER:\s*(.+?)\]/)?.[1] || '';
                  const gifPath = paragraph.match(/\[GIF:\s*(.+?)\]/)?.[1] || '';
                  const isEven = imageCounter % 2 === 0;
                  imageCounter++;

                  // Collect the next text content
                  const textContent: string[] = [];
                  let j = i + 1;
                  while (j < paragraphs.length &&
                         !paragraphs[j].startsWith('[IMAGE_PLACEHOLDER:') &&
                         !paragraphs[j].startsWith('[IMAGE:') &&
                         !paragraphs[j].startsWith('[GIF_PLACEHOLDER:') &&
                         !paragraphs[j].startsWith('[GIF:')) {
                    textContent.push(paragraphs[j]);
                    j++;
                  }

                  elements.push(
                    <motion.div
                      key={`gif-${i}`}
                      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className={`my-12 grid lg:grid-cols-2 gap-8 items-center`}
                    >
                      <div className={`${isEven ? '' : 'lg:order-2'}`}>
                        <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/10">
                          {isPlaceholder ? (
                            <>
                              <div className={`${imageCounter === 2 ? 'aspect-[16/9]' : imageCounter === 5 ? 'aspect-[21/9]' : 'aspect-video'} flex items-center justify-center`}>
                                <div className="text-center p-8">
                                  <Activity className="h-12 w-12 mx-auto mb-4 text-purple-400/50 animate-pulse" />
                                  <p className="text-sm text-purple-400/70 font-medium">Animation placeholder</p>
                                  <p className="text-xs text-white/40 mt-2">{description}</p>
                                </div>
                              </div>
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-orange-500/10"
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                              />
                            </>
                          ) : (
                            <>
                              <motion.img
                                src={gifPath}
                                alt="Blog animation"
                                className={`w-full h-full object-cover ${imageCounter === 2 ? 'aspect-[16/9]' : imageCounter === 5 ? 'aspect-[21/9]' : 'aspect-video'}`}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/30 to-transparent pointer-events-none" />
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`space-y-4 ${isEven ? '' : 'lg:order-1 lg:text-right'}`}>
                        {textContent.slice(0, 2).map((text, idx) =>
                          renderParagraph(text, `${i}-text-${idx}`)
                        )}
                      </div>
                    </motion.div>
                  );

                  // Skip the paragraphs we just consumed
                  i = j - 1;
                  continue;
                }

                // Regular paragraphs
                elements.push(renderParagraph(paragraph, i));
              }

              function renderParagraph(paragraph: string, key: string | number): JSX.Element | null {
                if (paragraph.startsWith('#')) {
                  const level = paragraph.match(/^#+/)?.[0].length || 1;
                  const text = paragraph.replace(/^#+\s/, '');
                const isMainTitle = level === 1;
                const hasEmoji = text.includes('🎨') || text.includes('✏️');

                if (isMainTitle) {
                  return (
                    <motion.h1
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl md:text-4xl font-bold mb-8 pb-2 leading-tight bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent"
                    >
                      {text}
                    </motion.h1>
                  );
                }

                if (level === 2) {
                  if (hasEmoji) {
                    return (
                      <motion.h2
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl md:text-3xl font-bold mb-4 mt-8 text-center"
                      >
                        <span className="bg-gradient-to-r from-orange-300 to-purple-300 bg-clip-text text-transparent">
                          {text}
                        </span>
                      </motion.h2>
                    );
                  }
                  return (
                    <motion.h2
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="text-xl md:text-2xl font-bold mb-4 mt-8 text-white"
                    >
                      {text}
                    </motion.h2>
                  );
                }

                const headingClass = `font-bold ${level === 3 ? 'text-lg mb-3 mt-6' : 'text-base mb-2 mt-4'}`;
                return <h3 key={key} className={headingClass}>{text}</h3>;
              }

              // Handle bullet points with bold text
              if (paragraph.startsWith('-')) {
                return (
                  <motion.ul
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-3 my-6"
                  >
                    {paragraph.split('\n').map((item, j) => {
                      const cleanItem = item.replace(/^-\s/, '');
                      const parts = cleanItem.split('**');

                      return (
                        <li key={j} className="flex items-start gap-3">
                          <span className="text-orange-400 mt-1.5">▸</span>
                          <span className="text-white/80 flex-1">
                            {parts.map((part, k) =>
                              k % 2 === 1 ? <strong key={k} className="text-orange-300 font-semibold">{part}</strong> : part
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </motion.ul>
                );
              }

              if (paragraph.match(/^\d\./)) {
                return (
                  <ol key={key} className="list-decimal list-inside space-y-2 my-4">
                    {paragraph.split('\n').map((item, j) => (
                      <li key={j} className="text-white/80">
                        {item.replace(/^\d\.\s\*\*(.+?)\*\*/, '$1').replace(/^\d\.\s/, '')}
                      </li>
                    ))}
                  </ol>
                );
              }

              if (paragraph.startsWith('*"')) {
                return (
                  <blockquote key={key} className="border-l-4 border-orange-500 pl-4 my-4 italic text-white/70">
                    {paragraph.replace(/\*/g, '')}
                  </blockquote>
                );
              }

              // Handle comparison sections
              if (paragraph.includes('Traditional AI tools:') || paragraph.includes('MasterStroke AI:')) {
                const sections = paragraph.split('\n\n');
                return (
                  <div key={key} className="grid md:grid-cols-2 gap-6 my-8">
                    {sections.map((section, idx) => {
                      const lines = section.split('\n');
                      const title = lines[0].replace(':', '');
                      const items = lines.slice(1);
                      const isTraditional = title.includes('Traditional');

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 }}
                          className={`rounded-xl p-6 border ${
                            isTraditional
                              ? 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5'
                              : 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5'
                          }`}
                        >
                          <h4 className={`font-bold mb-4 ${
                            isTraditional ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {title}
                          </h4>
                          <ul className="space-y-2">
                            {items.filter(item => item.trim()).map((item, k) => (
                              <li key={k} className="flex items-start gap-2">
                                <span className={isTraditional ? 'text-red-400/60' : 'text-green-400/60'}>•</span>
                                <span className="text-white/70 text-sm">
                                  {item.replace(/^-\s/, '')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              }

              // Don't render image/gif tags as text if they somehow slip through
              if (paragraph.startsWith('[IMAGE:') || paragraph.startsWith('[GIF:') ||
                  paragraph.startsWith('[IMAGE_PLACEHOLDER:') || paragraph.startsWith('[GIF_PLACEHOLDER:')) {
                return null;
              }

              return (
                <motion.p
                  key={key}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-white/80 leading-relaxed my-4"
                >
                  {paragraph}
                </motion.p>
              );
              }

              return elements.filter((el): el is JSX.Element => el !== null);
            })()}
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
                        whileInView={{ opacity: 1, scale: 1, x: 10 }}
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