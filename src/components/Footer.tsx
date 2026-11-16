"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLenis } from "lenis/react";
import { ArrowUpRightIcon, ArrowUpIcon, CopyIcon } from "@phosphor-icons/react";
import { MaskLines } from "./Reveal";
import LocalTime from "./LocalTime";
import { copyEmail } from "@/lib/copyEmail";
import { site } from "@/lib/site";

export default function Footer() {
  const pathname = usePathname();
  const lenis = useLenis();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const nameY = useTransform(scrollYProgress, [0, 1], ["40%", "0%"]);
  const wdth = useTransform(scrollYProgress, [0.3, 1], [60, 150]);
  const fvs = useTransform(wdth, (w) => `"wdth" ${w.toFixed(1)}, "wght" 900`);

  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <footer ref={ref} className="relative overflow-hidden bg-ink text-paper">
      <div className="shell pt-24 md:pt-36">
        {pathname !== "/contact" && (
          <div className="grid-12 gap-y-10 pb-20 md:pb-28">
            <div className="col-span-4 md:col-span-9 md:col-start-4">
              <Link href="/contact" className="group block">
                <MaskLines
                  as="p"
                  className="f-display whitespace-nowrap text-[clamp(2.6rem,8.6vw,10rem)] uppercase"
                  lines={[
                    <span key="a" style={{ "--wdth": 70 } as React.CSSProperties} className="f-display">
                      Un projet ?
                    </span>,
                    <span key="b" className="f-display inline-flex items-center gap-[0.15em]" style={{ "--wdth": 112 } as React.CSSProperties}>
                      <span className="opal-text">Parlons-en</span>
                      <ArrowUpRightIcon
                        weight="bold"
                        className="h-[0.7em] w-[0.7em] text-signal transition-transform duration-700 ease-[var(--ease-expo)] group-hover:rotate-45"
                      />
                    </span>,
                  ]}
                />
              </Link>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href={`mailto:${site.email}`} className="u-link text-xl md:text-2xl">
                  {site.email}
                </a>
                <button type="button" onClick={copyEmail} className="f-label flex min-h-6 items-center gap-2 text-paper/70 hover:text-paper">
                  <CopyIcon size={14} /> Copier
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid-12 gap-y-8 border-t border-paper/15 py-10">
          <div className="f-label col-span-2 md:col-span-3">
            <p className="text-paper/65">Navigation</p>
            <ul className="mt-2">
              {[{ href: "/", label: "Accueil" }, ...site.nav].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="u-link inline-block py-1.5">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="f-label col-span-2 md:col-span-3">
            <p className="text-paper/65">Réseaux</p>
            <ul className="mt-2">
              {site.socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link inline-flex items-center gap-1 py-1.5">
                    {s.label} <ArrowUpRightIcon size={11} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="f-label col-span-2 md:col-span-3">
            <p className="text-paper/65">{site.city}</p>
            <p className="mt-3">
              <LocalTime />
            </p>
          </div>
          <div className="f-label col-span-2 flex flex-col items-start justify-end gap-4 md:col-span-3 md:items-end">
            <button type="button" onClick={toTop} className="group flex min-h-6 items-center gap-2 py-1.5">
              Haut de page
              <ArrowUpIcon size={12} className="transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Nom géant qui s'étire en arrivant en bas de page */}
      <div className="footer-name mx-[calc(var(--gutter)*0.5)] overflow-hidden" aria-hidden>
        <motion.p
          className="f-display opal-text whitespace-nowrap pb-[0.06em] text-center uppercase leading-[0.86]"
          style={{ y: nameY, fontVariationSettings: fvs }}
        >
          Noam Guez
        </motion.p>
      </div>
      <div className="shell f-label flex justify-between py-4 text-paper/65">
        <span>© {new Date().getFullYear()} Noam Guez — {site.role}</span>
        <span>Tous droits réservés</span>
      </div>
    </footer>
  );
}
