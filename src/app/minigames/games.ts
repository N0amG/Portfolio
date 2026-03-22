export type Game = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string; // couleur dominante de la carte (hex)
  available: boolean;
  href?: string;
};

export const games: Game[] = [
  {
    id: "blind-text",
    title: "BlindText",
    description: "Un blind test… sans musique. Une voix de synthèse lit une chanson — à toi de deviner laquelle.",
    emoji: "🔊",
    color: "#6366f1",
    available: true,
    href: "/minigames/blind-text",
  },
];
