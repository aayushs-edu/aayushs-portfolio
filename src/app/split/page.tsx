import type { Metadata } from "next";
import SplitHero from "@/components/hero/SplitHero";

// Preview of the split hero (branch hero-split). The home page keeps the gallery hero.
export const metadata: Metadata = {
  title: "Aayush Sharma: Art | Code (preview)",
  robots: { index: false, follow: false },
};

export default function SplitPreviewPage() {
  return (
    <main>
      <SplitHero />
    </main>
  );
}
