"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";
import { useLenisLock } from "./SmoothScroll";
import { site, ease, easeInOut } from "@/lib/site";

/** Bouton pilule principal (terracotta), réutilisé dans le header, le menu et le footer. */
export const ctaClass =
  "group inline-flex h-12 items-center gap-2 rounded-full bg-accent-ink px-6 font-semibold text-on-accent transition-colors hover:bg-accent";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const clickCount = useRef(0);
  const isDev = process.env.NODE_ENV === "development";

  useLenisLock(menuOpen);

  // Masqué en descendant, réaffiché en remontant ; fond flou après 40 px.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 160 && y > prev);
    setScrolled(y > 40);
  });

  useEffect(() => {
    clickCount.current = 0;
  }, [pathname]);

  // Easter egg — dev uniquement (5 clics sur le logo)
  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (!isDev) return;
      clickCount.current += 1;
      if (clickCount.current >= 5) {
        clickCount.current = 0;
        router.push("/minigames");
      }
    },
    [pathname, isDev, router],
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled || menuOpen
            ? "border-b border-line bg-paper/85 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
        animate={{ y: hidden && !menuOpen ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="shell flex h-[72px] items-center justify-between gap-6">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="f-display text-[1.375rem] leading-none [--wght:520]"
            aria-label="Noam Guez — accueil"
          >
            Noam Guez
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
            {site.nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`group relative py-2 text-[0.9375rem] font-medium transition-colors hover:text-accent-ink ${
                  isActive(l.href) ? "text-accent-ink" : ""
                }`}
              >
                {l.label}
                <span
                  className={`absolute bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-500 ease-[var(--ease-expo)] ${
                    isActive(l.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="h-11 w-11" />
            <Link href="/contact" className={`${ctaClass.replace("inline-flex", "hidden sm:inline-flex")} h-11 px-5 text-[0.9375rem]`}>
              Demander un devis
              <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[0.9375rem] font-medium md:hidden"
              aria-label="Ouvrir le menu"
            >
              Menu
              <span className="flex flex-col gap-[3px]">
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-4 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Menu mobile plein écran */}
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <AnimatePresence>
          {menuOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  className="shell fixed inset-0 z-[70] flex flex-col bg-paper text-ink"
                  initial={{ clipPath: "inset(0 0 100% 0)" }}
                  animate={{ clipPath: "inset(0 0 0% 0)" }}
                  exit={{ clipPath: "inset(0 0 100% 0)" }}
                  transition={{ duration: 0.7, ease: easeInOut }}
                >
                  <Dialog.Title className="sr-only">Menu</Dialog.Title>
                  <div className="flex h-[72px] items-center justify-between">
                    <span className="f-display text-[1.375rem] leading-none [--wght:520]">Noam Guez</span>
                    <Dialog.Close className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[0.9375rem] font-medium">
                      Fermer
                      <span className="relative block h-3 w-3">
                        <span className="absolute top-1/2 block h-px w-full rotate-45 bg-current" />
                        <span className="absolute top-1/2 block h-px w-full -rotate-45 bg-current" />
                      </span>
                    </Dialog.Close>
                  </div>

                  <nav className="mt-10 flex flex-col" aria-label="Navigation mobile">
                    {[{ href: "/", label: "Accueil" }, ...site.nav].map((l, i) => (
                      <div key={l.href} className="overflow-hidden border-b border-line">
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: "0%" }}
                          exit={{ y: "100%" }}
                          transition={{ duration: 0.8, delay: 0.25 + i * 0.06, ease }}
                        >
                          <Link
                            href={l.href}
                            onClick={() => setMenuOpen(false)}
                            aria-current={pathname === l.href ? "page" : undefined}
                            className={`f-display block py-4 text-[2.5rem] leading-tight [--wght:450] ${
                              pathname === l.href ? "text-accent-ink" : ""
                            }`}
                          >
                            {l.label}
                          </Link>
                        </motion.div>
                      </div>
                    ))}
                  </nav>

                  <motion.div
                    className="mt-auto flex flex-col gap-6 pb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link href="/contact" onClick={() => setMenuOpen(false)} className={`${ctaClass} justify-center`}>
                      Demander un devis
                      <ArrowRightIcon size={16} weight="bold" />
                    </Link>
                    <div className="flex flex-wrap items-center justify-between gap-4 text-[0.9375rem] text-muted">
                      <a href={`mailto:${site.email}`} className="hover:text-ink">
                        {site.email}
                      </a>
                      <div className="flex gap-4">
                        {site.socials.map((s) => (
                          <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-ink">
                            {s.label}
                            <ArrowUpRightIcon size={12} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
