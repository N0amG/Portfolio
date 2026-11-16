import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Noam Guez — Développeur web freelance à Lyon",
  description:
    "Développeur web freelance à Lyon. Je conçois et développe sites, applications web et API en React, Next.js, Node.js et Django.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="grain relative flex min-h-svh w-full flex-col overflow-x-clip text-ink">
        <a
          href="#contenu"
          className="f-label opal-fill fixed left-3 top-3 z-[100] -translate-y-20 px-3 py-2 text-on-signal focus:translate-y-0"
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
