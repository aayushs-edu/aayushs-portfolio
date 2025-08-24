// src/components/Navigation.tsx
"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  Github, 
  Linkedin, 
  Mail, 
  Sun, 
  Moon, 
  Menu,
  Palette,
  Film,
  Code,
  Gamepad2,
  Trophy,
  Sparkles,
  Home
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Navigation() {
  const [theme, setTheme] = useState("dark");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Paintings", href: "/paintings", icon: Palette },
    { label: "Animation", href: "/animation", icon: Film },
    { label: "Games", href: "/games", icon: Gamepad2 },
    { label: "Hackathons", href: "/hackathons", icon: Code },
    { label: "MasterStroke", href: "/masterstroke", icon: Sparkles },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3 shadow-lg shadow-black/20 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              AS
            </span>
            <span className="hidden sm:inline">Aayush Sharma</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Button 
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <Socials />
            
            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button size="sm" variant="secondary">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-neutral-950/95 backdrop-blur-lg">
                <div className="mt-10 flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => setOpen(false)}
                      >
                        <Button 
                          variant={isActive(link.href) ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                        >
                          <Icon className="h-5 w-5" />
                          {link.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: string; setTheme: (theme: string) => void }) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
      className="gap-2"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function Socials() {
  const iconClass = "h-5 w-5";
  return (
    <div className="hidden items-center gap-1 sm:flex">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href="#" aria-label="GitHub">
              <Button variant="ghost" size="sm">
                <Github className={iconClass} />
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent>GitHub</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href="#" aria-label="LinkedIn">
              <Button variant="ghost" size="sm">
                <Linkedin className={iconClass} />
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent>LinkedIn</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href="mailto:you@email.com" aria-label="Email">
              <Button variant="ghost" size="sm">
                <Mail className={iconClass} />
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent>Email me</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}