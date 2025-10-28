// src/components/Footer.tsx
"use client"
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Github,
  Linkedin,
  Mail,
  Download,
  ChevronRight
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Paintings", href: "/paintings" },
    { name: "Animation", href: "/animation" },
    { name: "AI Projects", href: "/hackathons" },
    { name: "Games", href: "/games" },
    { name: "Paintwise AI", href: "/paintwise" }
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/aayushs-edu", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/in/aayush-sharma-1420bb311", label: "LinkedIn" },
    { icon: Mail, href: "mailto:aayushs2008@gmail.com", label: "Email" }
  ];

  return (
    <footer className="relative bg-gradient-to-b from-[#020202] to-black border-t border-white/10">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* About Column */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Aayush Sharma
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Multi-disciplinary creative combining art, technology, and design.
              Painter, animator, AI engineer, developer, and game designer.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => {
                const Icon = social.icon;
                return (
                  <a
                    key={i}
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group"
                    aria-label={social.label}
                  >
                    <div className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-300">
                      <Icon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Get In Touch</h4>
            <div className="space-y-3">
              <a
                href="mailto:aayushs2008@gmail.com"
                className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm group"
              >
                <div className="h-8 w-8 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                  <Mail className="h-4 w-4" />
                </div>
                aayushs2008@gmail.com
              </a>
              <a
                href="/Aayush_Sharma_Resume.pdf"
                download
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                  <Download className="h-4 w-4" />
                </div>
                Download Resume
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm text-center md:text-left">
              &copy; {currentYear} Aayush Sharma. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
