"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";
import LocalTime from "./LocalTime";
import { useCommandMenu } from "./CommandMenu";
import { useLenisLock } from "./SmoothScroll";
import { site, ease, easeInOut } from "@/lib/site";

export function Monogram({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M4 34V6h5l12 18V6h5v28h-5L9 16v18H4Z" fill="currentColor" />
      <rect x="29" y="29" width="7" height="5" fill={mono ? "currentColor" : "var(--signal)"} />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { setOpen: openPalette } = useCommandMenu();
  const { scrollY } = useScroll();
  const clickCount = useRef(0);
  const isDev = process.env.NODE_ENV === "development";

  useLenisLock(menuOpen);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 160 && y > prev);
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
        className="shell fixed inset-x-0 top-0 z-50 text-white mix-blend-difference"
        animate={{ y: hidden && !menuOpen ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="grid-12 items-center py-4 md:py-5">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="col-span-2 flex items-center gap-3 md:col-span-3"
            aria-label="Noam Guez — accueil"
          >
            <Monogram mono className="h-7 w-7 shrink-0" />
            <span className="f-label hidden leading-tight sm:block">Noam Guez</span>
          </Link>

          <div className="f-label col-span-3 hidden leading-tight md:block">
            {site.role}
            <br />
            <span className="opacity-60">
              Lyon&nbsp;&nbsp;
              <LocalTime />
            </span>
          </div>

          <nav className="col-span-4 hidden items-center gap-5 md:flex lg:gap-8" aria-label="Navigation principale">
            {site.nav.map((l) => (
              <Link key={l.href} href={l.href} className="f-label group flex items-baseline">
                <span className="relative">
                  {l.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-current transition-transform duration-500 ease-[var(--ease-expo)] ${
                      isActive(l.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </span>
              </Link>
            ))}
          </nav>

          <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-2">
            <button
              type="button"
              onClick={() => openPalette(true)}
              className="f-label hidden h-9 items-center gap-2 border border-white/30 px-2.5 transition-colors hover:border-white md:flex"
              aria-label="Ouvrir la palette de commandes"
            >
              <span className="hidden xl:inline">Rechercher</span>
              <kbd className="opacity-60">⌘K</kbd>
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="f-label ml-1 flex h-9 items-center gap-2 md:hidden"
              aria-label="Ouvrir le menu"
            >
              Menu
              <span className="flex flex-col gap-[3px]">
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-3 self-end bg-current" />
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
                  className="shell fixed inset-0 z-[70] flex flex-col bg-ink text-paper"
                  initial={{ clipPath: "inset(0 0 100% 0)" }}
                  animate={{ clipPath: "inset(0 0 0% 0)" }}
                  exit={{ clipPath: "inset(0 0 100% 0)" }}
                  transition={{ duration: 0.7, ease: easeInOut }}
                >
                  <Dialog.Title className="sr-only">Menu</Dialog.Title>
                  <div className="flex items-center justify-between py-4">
                    <Monogram className="h-7 w-7" />
                    <Dialog.Close className="f-label flex h-9 items-center gap-2">
                      Fermer
                      <span className="relative block h-3 w-3">
                        <span className="absolute top-1/2 block h-px w-full rotate-45 bg-current" />
                        <span className="absolute top-1/2 block h-px w-full -rotate-45 bg-current" />
                      </span>
                    </Dialog.Close>
                  </div>

                  <nav className="mt-auto flex flex-col" aria-label="Navigation mobile">
                    {[{ href: "/", label: "Accueil" }, ...site.nav].map((l, i) => (
                      <div key={l.href} className="overflow-hidden border-t border-paper/15">
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: "0%" }}
                          exit={{ y: "100%" }}
                          transition={{ duration: 0.8, delay: 0.25 + i * 0.06, ease }}
                        >
                          <Link
                            href={l.href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-baseline justify-between py-3"
                          >
                            <span
                              className={`f-display whitespace-nowrap text-[12.5vw] uppercase ${pathname === l.href ? "opal-text" : ""}`}
                              style={{ "--wdth": 108, "--wght": 850 } as React.CSSProperties}
                            >
                              {l.label}
                            </span>
                          </Link>
                        </motion.div>
                      </div>
                    ))}
                  </nav>

                  <motion.div
                    className="f-label flex flex-wrap items-end justify-between gap-4 border-t border-paper/15 py-5 text-paper/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex gap-4">
                      {site.socials.map((s) => (
                        <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-paper">
                          {s.label}
                          <ArrowUpRightIcon size={12} />
                        </a>
                      ))}
                    </div>
                    <span>
                      Lyon <LocalTime />
                    </span>
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
