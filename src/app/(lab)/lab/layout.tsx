import type { Metadata, Viewport } from "next";
import "./lab.css";
import { lab } from "@/lab/config";

/* Layout racine du lab : indépendant du site freelance (pas de polices, thème ni composants partagés). */

export const metadata: Metadata = {
  metadataBase: new URL(lab.url),
  title: { default: lab.name, template: `%s · ${lab.name}` },
  description: lab.description,
  alternates: { canonical: "/" },
  robots: lab.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", locale: "fr_FR", url: lab.url, siteName: lab.name, title: lab.name, description: lab.description },
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  colorScheme: "dark",
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="lab-body" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
