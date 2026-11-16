"use client";

import { MotionConfig } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import ThemeProvider from "./ThemeProvider";
import SmoothScroll from "./SmoothScroll";
import { CommandMenuProvider } from "./CommandMenu";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Tooltip.Provider delayDuration={250} skipDelayDuration={120}>
          <CommandMenuProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </CommandMenuProvider>
        </Tooltip.Provider>
      </MotionConfig>
      <Toaster
        position="bottom-left"
        offset={24}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex w-[min(92vw,380px)] items-center gap-3 border border-ink bg-ink px-4 py-3 text-paper shadow-[6px_6px_0_0_var(--signal)]",
            title: "f-label !text-[12px]",
            description: "text-sm text-paper/70",
            icon: "text-signal",
          },
        }}
      />
    </ThemeProvider>
  );
}
