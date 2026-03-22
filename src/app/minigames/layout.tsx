import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mini Jeux — Noam Guez",
  description: "Une collection de mini-jeux ludiques créés par Noam Guez.",
  icons: {
    icon: "/img/avatar.webp",
  },
};

export default function MinigamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="minigames-root">
      {children}
    </div>
  );
}
