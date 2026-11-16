"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useLenisLock } from "./SmoothScroll";
import { pad, ease } from "@/lib/site";

interface LightboxProps {
  images: string[];
  index: number | null;
  alt: string;
  onClose: () => void;
}

function Slides({ images, start, alt, onClose }: { images: string[]; start: number; alt: string; onClose: () => void }) {
  const [emblaRef, embla] = useEmblaCarousel({ startIndex: start, loop: images.length > 1, duration: 28 });
  const [current, setCurrent] = useState(start);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setCurrent(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <div
      className="flex h-full flex-col"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }}
    >
      <div className="shell f-label flex items-center justify-between py-4 text-paper/70">
        <span>
          {alt} — <span className="text-paper">{pad(current + 1)}</span> / {pad(images.length)}
        </span>
        <Dialog.Close className="flex items-center gap-2 text-paper hover:text-accent">
          Fermer
          <span className="relative block h-3 w-3">
            <span className="absolute top-1/2 block h-px w-full rotate-45 bg-current" />
            <span className="absolute top-1/2 block h-px w-full -rotate-45 bg-current" />
          </span>
        </Dialog.Close>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {images.map((src, i) => (
            <div key={src} className="flex h-full min-w-0 flex-[0_0_100%] items-center justify-center px-[var(--gutter)]">
              <img
                src={src}
                alt={`${alt} — capture ${i + 1}`}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full select-none object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="shell flex items-center justify-between py-4">
        <div className="flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Capture ${i + 1}`}
              className="h-6 w-6 p-[10px]"
            >
              <span className={`block h-full w-full transition-colors ${i === current ? "bg-accent" : "bg-paper/30"}`} />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 text-paper">
            <button type="button" onClick={prev} aria-label="Précédente" className="grid h-11 w-11 place-items-center border border-paper/30 hover:border-paper">
              <ArrowLeftIcon size={18} />
            </button>
            <button type="button" onClick={next} aria-label="Suivante" className="grid h-11 w-11 place-items-center border border-paper/30 hover:border-paper">
              <ArrowRightIcon size={18} />
            </button>
          </div>
        )}
      </div>
      <button type="button" className="sr-only" onClick={onClose}>
        Fermer
      </button>
    </div>
  );
}

export default function Lightbox({ images, index, alt, onClose }: LightboxProps) {
  const open = index !== null;
  useLenisLock(open);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                data-lenis-prevent
                className="fixed inset-0 z-[90] bg-ink text-paper"
                initial={{ clipPath: "inset(50% 0 50% 0)" }}
                animate={{ clipPath: "inset(0% 0 0% 0)" }}
                exit={{ clipPath: "inset(50% 0 50% 0)" }}
                transition={{ duration: 0.6, ease }}
              >
                <Dialog.Title className="sr-only">{alt} — captures d&apos;écran</Dialog.Title>
                <Slides images={images} start={index ?? 0} alt={alt} onClose={onClose} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
