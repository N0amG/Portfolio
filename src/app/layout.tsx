import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";
import { defaultDescription, defaultTitle, keywords, seoRole, siteUrl, titleTemplate } from "@/lib/seo";

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
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: titleTemplate },
  description: defaultDescription,
  keywords,
  applicationName: site.name,
  authors: [{ name: site.name, url: siteUrl }],
  creator: site.name,
  publisher: site.name,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: `${site.name}, ${seoRole.toLowerCase()}`,
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
  other: {
    "geo.region": "FR-69",
    "geo.placename": "Lyon",
  },
};

export const viewport: Viewport = {
  // Suit le thème de l'appareil (le bouton du site prend ensuite le relais)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF5E8" },
    { media: "(prefers-color-scheme: dark)", color: "#001219" },
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
