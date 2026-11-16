"use client";

import { toast } from "sonner";
import { site } from "./site";

/** Copie l'adresse email dans le presse-papiers (repli : ouvre le client mail). */
export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(site.email);
    toast("Adresse copiée", { description: site.email });
  } catch {
    window.location.href = `mailto:${site.email}`;
  }
}
