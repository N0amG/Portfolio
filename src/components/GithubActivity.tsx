"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface GithubEvent {
  id: string;
  repo: string;
  date: string;
  message: string;
  url: string;
}

type CommitCategory = "add" | "remove" | "update" | "merge" | "fix" | "version" | "default";

const CATEGORY_KEYWORDS: Record<string, CommitCategory> = {
  add: "add",
  added: "add",
  create: "add",
  created: "add",
  feat: "add", 
  fix: "fix",
  fixed: "fix",
  fixes: "fix",
  bug: "fix",
  bugfix: "fix",
  remove: "remove",
  removed: "remove",
  delete: "remove",
  deleted: "remove",
  update: "update",
  updated: "update",
  upgrade: "update",
  upgraded: "update",
  merge: "merge",
  merged: "merge",
};

const CATEGORY_STYLES: Record<CommitCategory, { bg: string; text: string; border: string; label: string }> = {
  add:     { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Added" },
  fix:     { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20",  label: "Fix" },
  remove:  { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     label: "Removed" },
  update:  { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20",    label: "Updated" },
  merge:   { bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/20",  label: "Merge" },
  version: { bg: "bg-slate-700/50",   text: "text-slate-200",   border: "border-slate-600/30",   label: "" },
  default: { bg: "bg-slate-700/30",   text: "text-slate-400",   border: "border-slate-700/30",   label: "" },
};

function parseCommitMessage(raw: string): { category: CommitCategory; label: string; message: string } {
  // Prend uniquement la première ligne (ignore le corps du commit)
  const firstLine = raw.split("\n")[0].trim();

  // Extrait le premier mot
  const match = firstLine.match(/^(\S+)\s*(.*)/);
  if (!match) return { category: "default", label: "", message: firstLine };

  const firstWord = match[1];
  const rest = match[2];

  // Vérifie si c'est un numéro de version (ex: v1.2.3)
  if (/^v\d/i.test(firstWord)) {
    const cleanRest = rest.replace(/^[:\s]+/, "");
    return { category: "version", label: firstWord, message: cleanRest || firstWord };
  }

  // Vérifie si le premier mot correspond à une catégorie connue
  const normalized = firstWord.toLowerCase().replace(/[^a-z]/g, "");
  const category = CATEGORY_KEYWORDS[normalized];

  if (category) {
    const style = CATEGORY_STYLES[category];
    // Supprime les deux-points éventuels en début du reste
    const cleanRest = rest.replace(/^[:\s]+/, "");
    return { category, label: style.label, message: cleanRest };
  }

  // Cas par défaut : on garde le message tel quel
  return { category: "default", label: "", message: firstLine };
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "il y a quelques secondes";
  if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
  if (diffHour < 24) return `il y a ${diffHour} heure${diffHour > 1 ? "s" : ""}`;
  if (diffDay < 7) return `il y a ${diffDay} jour${diffDay > 1 ? "s" : ""}`;
  if (diffWeek < 5) return `il y a ${diffWeek} semaine${diffWeek > 1 ? "s" : ""}`;
  if (diffMonth < 12) return `il y a ${diffMonth} mois`;
  return `il y a ${diffYear} an${diffYear > 1 ? "s" : ""}`;
}

export default function GithubActivity() {
  const [events, setEvents] = useState<GithubEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/github")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: GithubEvent[]) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl bg-base-200 border border-base-content/10 animate-pulse">
            <div className="h-5 bg-base-300 rounded w-1/3 mb-3" />
            <div className="h-4 bg-base-300/60 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <p className="text-base-content/50 text-center py-8">
        Aucune activité GitHub récente trouvée.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {events.map((event, i) => {
        const { category, label, message } = parseCommitMessage(event.message);
        const style = CATEGORY_STYLES[category];

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative p-6 rounded-xl bg-base-200 border border-base-content/10 hover:border-primary/50 transition-all flex flex-col gap-3"
          >
            {/* Étiquette (pin) en haut à droite */}
            {label && (
              <span
                className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
              >
                {label}
              </span>
            )}

            <div className="flex items-center gap-3 pr-20">
              <span className="text-primary font-bold text-lg">{event.repo}</span>
              <span className="text-base-content/40 text-xs">
                {formatRelativeDate(event.date)}
              </span>
            </div>

            <p className="text-base-content/80 font-mono text-sm">{message}</p>

            <div className="pt-2">
              <a
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 w-fit"
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Voir sur GitHub
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
