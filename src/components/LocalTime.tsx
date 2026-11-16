"use client";

import { useEffect, useState } from "react";

const fmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Heure de Lyon, rendue uniquement côté client (pas de mismatch d'hydratation). */
export default function LocalTime({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={className} suppressHydrationWarning>
      <span className="tabular-nums">{now ?? "--:--:--"}</span>
    </span>
  );
}
