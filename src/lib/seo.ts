import { site } from "./site";

/**
 * Référencement : une seule source pour les balises meta, le sitemap et les
 * données structurées (JSON-LD). Cible : commerçants et indépendants qui cherchent
 * un développeur web / une création de site à Lyon, puis en France à distance.
 */

export const siteUrl = "https://noamguez.fr";

/** Intitulé qui porte le SEO ("Creative developer" reste l'intitulé du design). */
export const seoRole = "Développeur web freelance";
export const seoCity = "Lyon";

export const defaultTitle = `${seoRole} à ${seoCity} | Création de sites internet – ${site.name}`;
export const titleTemplate = `%s | ${site.name}, ${seoRole.toLowerCase()} à ${seoCity}`;

export const defaultDescription =
  "Noam Guez, développeur web freelance à Lyon : création de sites internet, sites vitrines et réservation en ligne pour restaurants, commerçants, artisans et indépendants. Devis sans engagement, partout en France.";

/** Mots-clés visés (requêtes locales et par métier, plus accessibles qu'un terme national). */
export const keywords = [
  "développeur web freelance Lyon",
  "développeur freelance Lyon",
  "développeur web Lyon",
  "création site internet Lyon",
  "création site vitrine Lyon",
  "création site web Lyon",
  "site internet restaurant Lyon",
  "site vitrine restaurant",
  "site internet commerçant",
  "site internet artisan",
  "réservation en ligne restaurant",
  "prise de rendez-vous en ligne",
  "refonte site internet",
  "référencement local",
  "développeur web freelance",
  "création site internet",
  "développeur React freelance",
  "développeur Next.js freelance",
  "creative developer",
];

/** Zone d'intervention (texte visible et données structurées). */
export const areaServed = ["Lyon", "Villeurbanne", "Métropole de Lyon", "Rhône", "Auvergne-Rhône-Alpes", "France"];

export const services = [
  {
    name: "Création de site vitrine",
    description: "Site vitrine pour restaurant, commerce ou artisan : horaires, carte ou catalogue, photos, plan d'accès, bien référencé sur Google.",
  },
  {
    name: "Site avec réservation en ligne",
    description: "Réservation ou prise de rendez-vous en ligne avec confirmation par email, pour restaurants, salons et prestataires.",
  },
  {
    name: "Application web sur mesure",
    description: "Espace client, outil de gestion ou plateforme web développés sur mesure.",
  },
  {
    name: "Refonte et optimisation de site",
    description: "Refonte d'un site existant : plus rapide sur mobile, plus clair et mieux référencé.",
  },
];

export const socialUrls = site.socials.map((s) => s.href);

export const absoluteUrl = (path = "/") => new URL(path, siteUrl).toString();
