export const site = {
  name: "Noam Guez",
  role: "Développeur web fullstack",
  city: "Lyon, FR",
  coords: "45.76°N — 4.83°E",
  email: "noamguez0@gmail.com",
  status: "En recherche d'alternance",
  socials: [
    { label: "GitHub", href: "https://github.com/N0amG", handle: "@N0amG" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/noam-guez-0ba691261/", handle: "/in/noam-guez" },
  ],
  nav: [
    { href: "/projects", label: "Projets" },
    { href: "/about", label: "Profil" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export const ease = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.76, 0, 0.24, 1] as const;

export function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}
