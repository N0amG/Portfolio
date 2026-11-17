import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* ───────────────────────────────────────────────────────────
   Polices auto-hébergées (SIL OFL 1.1 — voir src/fonts/LICENSES.txt)
   Fraunces → titres (serif variable, axes wght 100–900 / SOFT 0–100)
   Manrope  → texte courant et libellés (wght 200–800)
   Les fallbacks ont des métriques ajustées : pas de décalage au chargement.
   ─────────────────────────────────────────────────────────── */
const display = localFont({
  src: [
    { path: "../fonts/Fraunces-Variable.woff2", style: "normal" },
    { path: "../fonts/Fraunces-Variable-Italic.woff2", style: "italic" },
  ],
  variable: "--ff-display",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const sans = localFont({
  src: [{ path: "../fonts/Manrope-Variable.woff2", style: "normal" }],
  variable: "--ff-sans",
  weight: "200 800",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Noam Guez — Creative developer",
  description: "Noam Guez, creative developer en France : sites et applications web sur mesure.",
  icons: {
    icon: "/img/avatar.webp",
    apple: "/img/avatar.webp",
  },
};

export const viewport: Viewport = {
  // Suit le thème de l'appareil (le bouton du site prend ensuite le relais)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3EA" },
    { media: "(prefers-color-scheme: dark)", color: "#121A16" },
  ],
};

/* Appliqué avant le premier paint : pas de flash de thème */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='night')t='dark';if(t==='winter')t='light';if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-theme="light"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
