export const site = {
  name: "Noam Guez",
  role: "Creative developer",
  city: "France",
  email: "noamguez0@gmail.com",
  /** Téléphone / WhatsApp affiché sur la page Contact (laisser vide pour le masquer), ex. "+33 6 12 34 56 78". */
  phone: "" as string,
  socials: [
    { label: "GitHub", href: "https://github.com/N0amG", handle: "@N0amG" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/noam-guez-0ba691261/", handle: "/in/noam-guez" },
  ],
  nav: [
    { href: "/projects", label: "Réalisations" },
    { href: "/about", label: "À propos" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

/** Ouvre une nouvelle conversation Gmail adressée à moi, avec un objet prérempli. */
export const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(site.email)}&su=${encodeURIComponent(
  "Demande de devis",
)}`;

export const ease = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.76, 0, 0.24, 1] as const;

export function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}
