import type { Metadata } from "next";
import JsonLd, { breadcrumb } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Contact et demande de devis",
  description:
    "Contactez Noam Guez, développeur web freelance à Lyon, pour la création de votre site internet, site vitrine ou réservation en ligne. Réponse personnelle, devis sans engagement.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumb([{ name: "Contact", path: "/contact" }])} />
      {children}
    </>
  );
}
