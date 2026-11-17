import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Noam Guez — Creative developer",
  description:
    "Noam Guez, creative developer en France. J'analyse votre besoin et je conçois le site ou l'application web qui vous correspond.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="relative flex min-h-svh w-full flex-col overflow-x-clip text-ink">
        <a
          href="#contenu"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-full bg-accent-ink px-4 py-2 text-sm font-semibold text-on-accent focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <Navbar />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <SpeedInsights />
    </Providers>
  );
}
