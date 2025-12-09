// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Kalam, Sniglet } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Add font-display: swap for better performance
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const kalam = Kalam({
  weight: ["400", "700"],
  variable: "--font-kalam",
  subsets: ["latin"],
  display: "swap",
});

const sniglet = Sniglet({
  weight: ["400", "800"],
  variable: "--font-sniglet",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aayush Sharma - Art × Code Portfolio",
  description: "Portfolio showcasing art, animation, games, and creative coding",
  other: {
    'preload-images': '/images/portrait.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preload" href="/images/portrait.webp" as="image" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} ${sniglet.variable} antialiased dark`}
      >
        <Navigation />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}