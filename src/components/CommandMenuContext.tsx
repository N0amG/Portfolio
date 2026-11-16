"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// La palette (cmdk + dialog) n'est téléchargée qu'à sa première ouverture.
const CommandMenu = dynamic(() => import("./CommandMenu"), { ssr: false });

const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export const useCommandMenu = () => useContext(Ctx);

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const setOpen = useCallback((v: boolean) => {
    if (v) setLoaded(true);
    setOpenState(v);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setLoaded(true);
        setOpenState((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      {loaded && <CommandMenu />}
    </Ctx.Provider>
  );
}
