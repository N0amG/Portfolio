"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLenis } from "lenis/react";
import { ArrowUpRightIcon, ArrowUpIcon, CopyIcon } from "@phosphor-icons/react";
import { MaskLines } from "./Reveal";
import LocalTime from "./LocalTime";
import { copyEmail } from "./CommandMenu";
import { site } from "@/lib/site";
import { useFitText } from "@/lib/useFitText";

const FOOTER_NAME = ["Noam Guez"] as const;

export default function Footer() {
  const pathname = usePathname();
  const lenis = useLenis();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const nameY = useTransform(scrollYProgress, [0, 1], ["40%", "0%"]);
  const wdth = useTransform(scrollYProgress, [0.3, 1], [60, 150]);
  const fvs = useTransform(wdth, (w) => `"wdth" ${w.toFixed(1)}, "wght" 900`);

  const nameRef = useRef<HTMLDivElement>(null);
  useFitText(nameRef, FOOTER_NAME, `"wdth" 150, "wght" 900`, 0.99);

  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <footer ref={ref} className="relative overflow-hidden bg-ink text-paper">
      <div className="shell pt-24 md:pt-36">
        {pathname !== "/contact" && (
          <div className="grid-12 gap-y-10 pb-20 md:pb-28">
            <div className="f-label col-span-4 text-paper/50 md:col-span-3">
              <span className="text-signal">(→)</span>&nbsp;&nbsp;Prochaine étape
            </div>
            <div className="col-span-4 md:col-span-9">
              <Link href="/contact" className="group block">
                <MaskLines
                  as="p"
                  className="f-display whitespace-nowrap text-[clamp(2.6rem,8.6vw,10rem)] uppercase"
                  lines={[
                    <span key="a" style={{ "--wdth": 70 } as React.CSSProperties} className="f-display">
                      Un projet ?
                    </span>,
                    <span key="b" className="f-display inline-flex items-center gap-[0.15em] text-signal" style={{ "--wdth": 112 } as React.CSSProperties}>
                      Parlons-en
                      <ArrowUpRightIcon
                        weight="bold"
                        className="h-[0.7em] w-[0.7em] transition-transform duration-700 ease-[var(--ease-expo)] group-hover:rotate-45"
                      />
                    </span>,
                  ]}
                />
              </Link>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href={`mailto:${site.email}`} className="u-link text-xl md:text-2xl">
                  {site.email}
                </a>
                <button type="button" onClick={copyEmail} className="f-label flex items-center gap-2 text-paper/60 hover:text-paper">
                  <CopyIcon size={14} /> Copier
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid-12 gap-y-8 border-t border-paper/15 py-10">
          <div className="f-label col-span-2 md:col-span-3">
            <p className="text-paper/40">Pages</p>
            <ul className="mt-3 space-y-1.5">
              {[{ href: "/", label: "Accueil" }, ...site.nav].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="u-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="f-label col-span-2 md:col-span-3">
            <p className="text-paper/40">Ailleurs</p>
            <ul className="mt-3 space-y-1.5">
              {site.socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link inline-flex items-center gap-1">
                    {s.label} <ArrowUpRightIcon size={11} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="f-label col-span-2 md:col-span-3">
            <p className="text-paper/40">Basé à</p>
            <p className="mt-3">
              {site.city}
              <br />
              <LocalTime /> CET
            </p>
          </div>
          <div className="f-label col-span-2 flex flex-col items-start justify-between gap-4 md:col-span-3 md:items-end">
            <p className="text-paper/40 md:text-right">
              Anybody · Instrument Sans
              <br />
              Martian Mono — auto-hébergées
            </p>
            <button type="button" onClick={toTop} className="group flex items-center gap-2">
              Haut de page
              <ArrowUpIcon size={12} className="transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Nom géant qui s'étire en arrivant en bas de page */}
      <div ref={nameRef} className="mx-[calc(var(--gutter)*0.5)] overflow-hidden text-[10vw]" aria-hidden>
        <motion.p
          className="f-display whitespace-nowrap text-center uppercase leading-[0.78] text-paper"
          style={{ y: nameY, fontVariationSettings: fvs }}
        >
          Noam Guez
        </motion.p>
      </div>
      <div className="shell f-label flex justify-between py-4 text-paper/40">
        <span>© {new Date().getFullYear()} Noam Guez</span>
        <span>Tous droits réservés</span>
      </div>
    </footer>
  );
}
