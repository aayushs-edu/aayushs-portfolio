import type { Metadata } from "next";
import Showcase from "@/components/showcase/Showcase";
import { parseLayout } from "@/components/showcase/layouts";

// Preview of the split hero and the 3D showcase under it (branch hero-split).
// The home page keeps the gallery hero. ?layout=chapters tries the chapters layout.
export const metadata: Metadata = {
  title: "Aayush Sharma: Art | Code (preview)",
  robots: { index: false, follow: false },
};

export default async function SplitPreviewPage({ searchParams }: { searchParams: Promise<{ layout?: string | string[] }> }) {
  const { layout } = await searchParams;
  return (
    <main>
      <Showcase layout={parseLayout(layout)} />
    </main>
  );
}
