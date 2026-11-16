"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CopyIcon,
  MagnifyingGlassIcon,
  CircleHalfIcon,
} from "@phosphor-icons/react";
import { latestProjects } from "@/data/portfolio/projects";
import { site, ease } from "@/lib/site";
import { copyEmail } from "@/lib/copyEmail";
import { useTheme } from "./ThemeProvider";
import { useLenisLock } from "./SmoothScroll";
import { useCommandMenu } from "./CommandMenuContext";

const itemCls =
  "group flex cursor-pointer items-center gap-4 px-5 py-3 text-[15px] text-ink/80 transition-colors data-[selected=true]:bg-ink data-[selected=true]:text-paper";

export default function CommandMenu() {
  const { open, setOpen } = useCommandMenu();
  const { toggleTheme } = useTheme();
  const router = useRouter();
  useLenisLock(open);

  const run = useCallback(
    (fn: () => void) => {
      setOpen(false);
      // laisse la modale se fermer avant de naviguer
      window.setTimeout(fn, 60);
    },
    [setOpen],
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[95] bg-paper/70 backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                data-lenis-prevent
                className="fixed left-1/2 top-[12vh] z-[96] w-[min(94vw,640px)] -translate-x-1/2 border border-ink bg-paper shadow-[0_30px_80px_-20px_color-mix(in_oklab,var(--signal)_55%,transparent)]"
                initial={{ opacity: 0, y: -16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.35, ease }}
              >
                <Dialog.Title className="sr-only">Palette de commandes</Dialog.Title>
                <Command loop label="Palette de commandes" className="flex flex-col">
                  <div className="flex items-center gap-3 border-b border-line px-5">
                    <MagnifyingGlassIcon size={18} className="shrink-0 text-muted" />
                    <Command.Input
                      autoFocus
                      placeholder="Aller à une page, un projet, une action…"
                      className="h-14 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted focus-visible:outline-none"
                    />
                    <kbd className="f-label shrink-0 border border-line px-1.5 py-0.5 text-muted">esc</kbd>
                  </div>
                  <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto overscroll-contain py-2">
                    <Command.Empty className="f-label px-5 py-8 text-center text-muted">Aucun résultat.</Command.Empty>

                    <Command.Group heading="Pages" className="cmdk-group">
                      {[{ href: "/", label: "Accueil" }, ...site.nav].map((l) => (
                        <Command.Item key={l.href} value={`page ${l.label}`} onSelect={() => run(() => router.push(l.href))} className={itemCls}>
                          <ArrowRightIcon size={16} className="text-signal" />
                          <span className="flex-1">{l.label}</span>
                          <span className="f-label opacity-50">{l.href}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Group heading="Projets" className="cmdk-group">
                      {latestProjects.map((p) => (
                        <Command.Item
                          key={p.slug}
                          value={`projet ${p.title} ${p.tags.join(" ")} ${p.categoryLabel}`}
                          onSelect={() => run(() => router.push(`/projects/${p.slug}`))}
                          className={itemCls}
                        >
                          <span className="f-label w-9 text-signal">{p.date.slice(0, 4)}</span>
                          <span className="flex-1">{p.title}</span>
                          <span className="f-label hidden opacity-50 sm:inline">{p.categoryLabel}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Group heading="Actions" className="cmdk-group">
                      <Command.Item value="copier email adresse" onSelect={() => run(copyEmail)} className={itemCls}>
                        <CopyIcon size={16} className="text-signal" />
                        <span className="flex-1">Copier l&apos;adresse email</span>
                      </Command.Item>
                      <Command.Item value="thème sombre clair" onSelect={() => run(() => toggleTheme())} className={itemCls}>
                        <CircleHalfIcon size={16} className="text-signal" />
                        <span className="flex-1">Basculer le thème</span>
                      </Command.Item>
                      {site.socials.map((s) => (
                        <Command.Item
                          key={s.href}
                          value={`ouvrir ${s.label}`}
                          onSelect={() => run(() => window.open(s.href, "_blank", "noopener,noreferrer"))}
                          className={itemCls}
                        >
                          <ArrowUpRightIcon size={16} className="text-signal" />
                          <span className="flex-1">{s.label}</span>
                          <span className="f-label opacity-50">{s.handle}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </Command.List>
                  <div className="f-label flex justify-between border-t border-line px-5 py-2.5 text-muted">
                    <span>↑↓ naviguer · ↵ ouvrir</span>
                    <span>{site.name}</span>
                  </div>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
