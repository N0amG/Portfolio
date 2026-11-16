"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { useTheme } from "./ThemeProvider";

/** Un disque mi-plein qui pivote : pas d'icône soleil/lune. */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Passer en clair" : "Passer en sombre";

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
          aria-label={label}
          className={`group relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-alt ${className ?? ""}`}
        >
          <span
            className="block h-[18px] w-[18px] rounded-full border-[1.5px] border-current transition-transform duration-700 ease-[var(--ease-expo)] group-hover:rotate-180"
            style={{
              background: "linear-gradient(90deg, currentColor 50%, transparent 50%)",
              transform: isDark ? "rotate(0deg)" : "rotate(180deg)",
            }}
          />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={8} className="f-label z-[100] rounded-md bg-ink px-2 py-1 text-paper">
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
