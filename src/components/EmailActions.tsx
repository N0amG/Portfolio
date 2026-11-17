"use client";

import { CopyIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { copyEmail } from "@/lib/copyEmail";
import { site, gmailComposeUrl } from "@/lib/site";

const pill =
  "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition-colors";

/**
 * Contact sans formulaire : l'adresse, un bouton pour la copier, un pour ouvrir
 * directement un nouveau message dans Gmail (et un lien mailto pour les autres messageries).
 */
export default function EmailActions({ size = "md", align = "start" }: { size?: "md" | "lg"; align?: "start" | "end" }) {
  return (
    <div className={`flex flex-col gap-5 ${align === "end" ? "md:items-end" : "items-start"}`}>
      <a
        href={`mailto:${site.email}`}
        className={`u-link break-all font-semibold ${size === "lg" ? "f-display text-[clamp(1.6rem,4.6vw,3rem)] [--wght:430]" : "text-lg"}`}
      >
        {site.email}
      </a>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button type="button" onClick={copyEmail} className={`${pill} border border-ink hover:bg-ink hover:text-paper`}>
          <CopyIcon size={18} />
          Copier l&apos;adresse
        </button>
        <a
          href={gmailComposeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${pill} bg-accent-ink text-on-accent hover:bg-accent`}
        >
          <EnvelopeSimpleIcon size={18} />
          Écrire avec Gmail
        </a>
      </div>
    </div>
  );
}
