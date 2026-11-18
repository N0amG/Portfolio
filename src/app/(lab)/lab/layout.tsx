import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./lab.css";
import { lab } from "@/lab/config";

/* Layout racine du lab : indépendant du site freelance (pas de polices, thème ni composants partagés). */

/* ───────────────────────────────────────────────────────────
   Polices auto-hébergées (SIL OFL 1.1 — voir src/lab/fonts/LICENSES.txt)
   Syne           → nom et grands titres (wght 400–800)
   JetBrains Mono → micro-libellés façon HUD (wght 100–800)
   ─────────────────────────────────────────────────────────── */
const display = localFont({
  src: [{ path: "../../../lab/fonts/Syne-Variable.woff2", style: "normal" }],
  variable: "--ff-display",
  weight: "400 800",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

const mono = localFont({
  src: [{ path: "../../../lab/fonts/JetBrainsMono-Variable.woff2", style: "normal" }],
  variable: "--ff-mono",
  weight: "100 800",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(lab.url),
  title: { default: lab.name, template: `%s · ${lab.name}` },
  description: lab.description,
  alternates: { canonical: "/" },
  robots: lab.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", locale: "fr_FR", url: lab.url, siteName: lab.name, title: lab.name, description: lab.description },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${mono.variable}`}>
      <body className="lab-body" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
