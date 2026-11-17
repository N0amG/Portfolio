"use client";

import { useEffect, useState } from "react";

/* Vrai uniquement après le premier rendu côté client : le premier chargement
   n'a ni rideau ni fondu (sinon la page reste masquée pendant ~1 s, ce qui
   pénalise LCP et Speed Index). Les navigations suivantes ont la transition. */
let hasNavigated = false;

/**
 * Rejoué à chaque navigation (un template est re-monté) : un rideau nacré
 * remonte et la page glisse en place. Animations en CSS pur.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  // Figé au montage : un re-rendu ultérieur ne doit pas faire apparaître le rideau.
  const [animate] = useState(() => hasNavigated);

  useEffect(() => {
    hasNavigated = true;
  }, []);

  if (!animate) return <>{children}</>;

  return (
    <>
      <div aria-hidden className="page-curtain bg-alt pointer-events-none fixed inset-0 z-[80] origin-top" />
      <div className="page-enter">{children}</div>
    </>
  );
}
