// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Kalam } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kalam = Kalam({
  weight: ["400", "700"],
  variable: "--font-kalam",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aayush Sharma - Art × Code Portfolio",
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
        className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} antialiased dark`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}