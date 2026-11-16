import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommandMenu from "@/components/CommandMenu";

export const metadata: Metadata = {
  title: "Noam Guez | Développeur Web",
  description:
    "Portfolio de Noam Guez – Développeur Web passionné par la création d'applications web modernes avec React, Next.js, Python et Django.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="grain relative flex min-h-svh w-full flex-col overflow-x-clip bg-paper text-ink">
        <a
          href="#contenu"
          className="f-label fixed left-3 top-3 z-[100] -translate-y-20 bg-signal px-3 py-2 text-on-signal focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <Navbar />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
        <CommandMenu />
      </div>
      <SpeedInsights />
    </Providers>
  );
}
