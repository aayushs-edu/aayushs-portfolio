// src/components/Navigation.tsx
"use client"
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Github,
  Linkedin,
  Mail,
  Menu,
  Palette,
  Film,
  Code,
  Gamepad2,
  Sparkles,
  Home
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
    <div className="sticky top-0 z-40 w-full bg-black pt-4 pb-4">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between rounded-2xl bg-black backdrop-blur-md border border-white/10 p-3">
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

function Socials() {
  const iconClass = "h-5 w-5";
  return (
    <div className="hidden items-center gap-1 sm:flex">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
        <a
          href="https://github.com/aayushs-edu"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm">
            <Github className={iconClass} />
          </Button>
        </a>
          </TooltipTrigger>
          <TooltipContent>GitHub</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
        <a
          href="https://linkedin.com/in/aayush-sharma-1420bb311"
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm">
            <Linkedin className={iconClass} />
          </Button>
        </a>
          </TooltipTrigger>
          <TooltipContent>LinkedIn</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
        <a
          href="mailto:aayushs2008@email.com"
          aria-label="Email"
          target="_blank"
          rel="noopener noreferrer"
        >
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