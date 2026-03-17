"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "night" | "winter";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: "night", toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("night");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "night" || stored === "winter") {
      setTheme(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "night" ? "winter" : "night"));
  };

  // Prevent flash: render children only after mount
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </ThemeContext.Provider>
  );
}
