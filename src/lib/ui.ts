/*
 * Classes de boutons partagées. Elles vivent ici (module neutre) et non dans un
 * composant "use client" : une page serveur qui importe une constante depuis un
 * module client reçoit une référence client, pas la chaîne de classes.
 */

const ctaBase =
  "group inline-flex items-center gap-2 rounded-full bg-accent-ink font-semibold text-on-accent transition-colors hover:bg-accent";

/** Bouton pilule principal. */
export const ctaClass = `${ctaBase} h-12 px-6`;

/** Version grand format : l'unique appel au devis de la landing page. */
export const ctaLargeClass = `${ctaBase} h-16 px-10 text-lg`;
