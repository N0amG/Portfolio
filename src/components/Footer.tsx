"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { ArrowRightIcon, ArrowUpIcon, ArrowUpRightIcon, CopyIcon } from "@phosphor-icons/react";
import { FadeIn, MaskLines } from "./Reveal";
import { ctaClass } from "./Navbar";
import { copyEmail } from "@/lib/copyEmail";
import { site } from "@/lib/site";

export default function Footer() {
  const pathname = usePathname();
  const lenis = useLenis();
  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <footer className="mt-auto">
      {/* Bandeau d'appel au contact (absent de la page Contact) */}
      {pathname !== "/contact" && (
        <div className="shell pb-16 md:pb-24">
          <div className="rounded-[28px] bg-alt px-6 py-12 md:px-14 md:py-16">
            <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
              <div>
                <p className="f-label text-accent-ink">Parlons de votre projet</p>
                <MaskLines
                  as="h2"
                  className="f-display mt-4 text-[clamp(2rem,3.6vw,3.25rem)] [--wght:450]"
                  lines={["Un projet pour", "votre commerce ?"]}
                />
                <FadeIn delay={0.15}>
                  <p className="mt-5 max-w-[46ch] text-muted">
                    Décrivez-moi votre besoin en quelques lignes : je vous réponds avec mes questions ou une première
                    estimation.
                  </p>
                </FadeIn>
              </div>
              <FadeIn delay={0.2} className="flex flex-col items-start gap-4 md:items-end">
                <Link href="/contact" className={ctaClass}>
                  Demander un devis
                  <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
                </Link>
                <div className="flex items-center gap-3 text-[0.9375rem]">
                  <a href={`mailto:${site.email}`} className="u-link">
                    {site.email}
                  </a>
                  <button
                    type="button"
                    onClick={copyEmail}
                    aria-label="Copier l'adresse email"
                    className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:bg-card hover:text-ink"
                  >
                    <CopyIcon size={16} />
                  </button>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-line">
        <div className="shell grid grid-cols-2 gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:py-16">
          <div className="col-span-2 md:col-span-1">
            <p className="f-display text-[1.375rem] leading-none [--wght:520]">Noam Guez</p>
            <p className="mt-3 max-w-[34ch] text-[0.9375rem] text-muted">
              Sites internet et applications web pour les commerçants et indépendants, à Lyon.
            </p>
          </div>
          <nav aria-label="Pages">
            <p className="f-label text-muted">Pages</p>
            <ul className="mt-3 space-y-1">
              {[{ href: "/", label: "Accueil" }, ...site.nav].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="u-link inline-block py-1.5">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="f-label text-muted">Me suivre</p>
            <ul className="mt-3 space-y-1">
              {site.socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link inline-flex items-center gap-1 py-1.5">
                    {s.label} <ArrowUpRightIcon size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="shell">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-5 text-sm text-muted">
          <span>
            © {new Date().getFullYear()} Noam Guez — {site.role}
          </span>
          <button type="button" onClick={toTop} className="group inline-flex min-h-11 items-center gap-2 hover:text-ink">
            Haut de page
            <ArrowUpIcon size={14} className="transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
        </div>
      </div>
    </footer>
  );
}
