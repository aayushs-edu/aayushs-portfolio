// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Kalam, Pixelify_Sans, Poppins, Silkscreen } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

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

const poppins = Poppins({
  weight: ["800"],
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
});

/** The Games section's pixel faces: Pixelify Sans for its titles and names, Silkscreen for its small labels. Below the fold, so not preloaded. */
const pixelify = Pixelify_Sans({
  weight: ["400", "700"],
  variable: "--font-pixel",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  variable: "--font-pixel-small",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Aayush Sharma",
  description: "Portfolio showcasing art, animation, games, and creative coding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} ${poppins.variable} ${pixelify.variable} ${silkscreen.variable} antialiased dark`}
      >
        {children}
        <Analytics />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        <Footer />
      </body>
    </html>
  );
}