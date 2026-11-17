"use client";

import { MotionConfig } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import ThemeProvider from "./ThemeProvider";
import SmoothScroll from "./SmoothScroll";
import { RouteTracker } from "@/lib/navHistory";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Tooltip.Provider delayDuration={250} skipDelayDuration={120}>
          {/* Avant les pages : son effet s'exécute avant le leur à chaque navigation */}
          <RouteTracker />
          <SmoothScroll>{children}</SmoothScroll>
        </Tooltip.Provider>
      </MotionConfig>
      <Toaster
        position="bottom-left"
        offset={24}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex w-[min(92vw,380px)] items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card px-4 py-3 text-ink shadow-[var(--shadow-card-hover)]",
            title: "f-label !text-[12px]",
            description: "text-sm text-muted",
            icon: "text-accent-ink",
          },
        }}
      />
    </ThemeProvider>
  );
}
