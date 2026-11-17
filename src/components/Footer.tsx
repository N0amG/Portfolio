"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { ArrowUpIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { FadeIn, MaskLines } from "./Reveal";
import EmailActions from "./EmailActions";
import { site } from "@/lib/site";

export default function Footer() {
  const pathname = usePathname();
  const lenis = useLenis();
  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <footer className="mt-auto">
      {/* Bandeau d'appel au contact (absent de la page Contact) */}
      {pathname !== "/contact" && (
        <div className="shell pb-12 md:pb-16">
          <div className="rounded-[28px] bg-alt px-6 py-10 md:px-12 md:py-12">
            <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
              <div>
                <MaskLines
                  as="h2"
                  className="f-display text-[clamp(2rem,3.6vw,3.25rem)] [--wght:450]"
                  lines={["Un projet", "en tête ?"]}
                />
                <FadeIn delay={0.15}>
                  <p className="mt-5 max-w-[40ch] text-muted">Écrivez-moi en quelques lignes, je vous réponds rapidement.</p>
                </FadeIn>
              </div>
              <FadeIn delay={0.2}>
                <EmailActions align="end" />
              </FadeIn>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-line">
        <div className="shell grid grid-cols-2 gap-10 py-10 md:grid-cols-[1.5fr_1fr_1fr] md:py-12">
          <div className="col-span-2 md:col-span-1">
            <p className="f-display text-[1.375rem] leading-none [--wght:520]">Noam Guez</p>
            <p className="mt-3 max-w-[34ch] text-[0.9375rem] text-muted">
              Creative developer : sites et applications web sur mesure, partout en France.
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
            © {new Date().getFullYear()} Noam Guez, creative developer
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
