import { site } from "@/lib/site";
import { absoluteUrl, areaServed, defaultDescription, seoRole, services, siteUrl, socialUrls } from "@/lib/seo";

/** Insère des données structurées schema.org (JSON-LD), lisibles par Google. */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // "<" échappé : le JSON ne peut pas fermer la balise <script>
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const ids = {
  website: `${siteUrl}/#website`,
  person: `${siteUrl}/#person`,
  business: `${siteUrl}/#business`,
};

const knowsAbout = [
  "Création de sites internet",
  "Site vitrine",
  "Réservation en ligne",
  "Développement web",
  "Applications web",
  "Référencement naturel (SEO)",
  "Accessibilité web",
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
];

const address = {
  "@type": "PostalAddress",
  addressLocality: "Lyon",
  addressRegion: "Auvergne-Rhône-Alpes",
  addressCountry: "FR",
};

/** Graphe présent sur toutes les pages : le site, la personne, l'activité. */
export function siteGraph() {
  const phone = site.phone.trim();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": ids.website,
        url: siteUrl,
        name: `${site.name}, ${seoRole.toLowerCase()} à Lyon`,
        inLanguage: "fr-FR",
        publisher: { "@id": ids.person },
      },
      {
        "@type": "Person",
        "@id": ids.person,
        name: site.name,
        jobTitle: seoRole,
        description: "Développeur web freelance et creative developer à Lyon : création de sites internet pour commerçants et indépendants.",
        url: siteUrl,
        image: absoluteUrl("/img/selfie.jpeg"),
        email: `mailto:${site.email}`,
        address,
        knowsAbout,
        worksFor: { "@id": ids.business },
        sameAs: socialUrls,
      },
      {
        "@type": "ProfessionalService",
        "@id": ids.business,
        name: `${site.name}, ${seoRole.toLowerCase()} à Lyon`,
        alternateName: `${site.name}, creative developer`,
        description: defaultDescription,
        url: siteUrl,
        image: absoluteUrl("/opengraph-image"),
        logo: absoluteUrl("/icon-512.png"),
        email: site.email,
        ...(phone ? { telephone: phone } : {}),
        address,
        areaServed: areaServed.map((name) => ({ "@type": name === "France" ? "Country" : "Place", name })),
        founder: { "@id": ids.person },
        knowsAbout,
        serviceType: services.map((s) => s.name),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Création de sites internet",
          itemListElement: services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name, description: s.description, provider: { "@id": ids.business } },
          })),
        },
        sameAs: socialUrls,
      },
    ],
  };
}

/** Fil d'Ariane (affiché par Google sous le titre du résultat). */
export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Accueil", path: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqPage(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export const schemaIds = ids;
