import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* ───────────────────────────────────────────────────────────
   Polices auto-hébergées (SIL OFL 1.1 — voir src/fonts/LICENSES.txt)
   Anybody        → titres (axes variables wdth 50–150 / wght 100–900)
   Instrument Sans → texte courant
   Martian Mono   → métadonnées, labels, code
   ─────────────────────────────────────────────────────────── */
const display = localFont({
  src: [
    { path: "../fonts/Anybody-Variable.woff2", style: "normal" },
    { path: "../fonts/Anybody-Variable-Italic.woff2", style: "italic" },
  ],
  variable: "--ff-display",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "50% 150%" }],
  fallback: ["Arial Narrow", "Helvetica Neue", "sans-serif"],
});

const sans = localFont({
  src: [
    { path: "../fonts/InstrumentSans-Variable.woff2", style: "normal" },
    { path: "../fonts/InstrumentSans-Variable-Italic.woff2", style: "italic" },
  ],
  variable: "--ff-sans",
  weight: "400 700",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

const mono = localFont({
  src: [{ path: "../fonts/MartianMono-Variable.woff2", style: "normal" }],
  variable: "--ff-mono",
  weight: "100 800",
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Noam Guez — Développeur web freelance",
  description: "Noam Guez, développeur web freelance à Lyon : sites, applications web et API.",
  icons: {
    icon: "/img/avatar.webp",
    apple: "/img/avatar.webp",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F2FA" },
    { media: "(prefers-color-scheme: dark)", color: "#080B1F" },
  ],
};

/* Appliqué avant le premier paint : pas de flash de thème */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='night')t='dark';if(t==='winter')t='light';if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
