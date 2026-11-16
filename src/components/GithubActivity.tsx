"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { ease } from "@/lib/site";

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

const LABELS: Record<CommitCategory, string> = {
  add: "ajout",
  fix: "correctif",
  remove: "retrait",
  update: "maj",
  merge: "fusion",
  version: "",
  default: "",
};

function parseCommitMessage(raw: string): { category: CommitCategory; label: string; message: string } {
  const firstLine = raw.split("\n")[0].trim();
  const match = firstLine.match(/^(\S+)\s*(.*)/);
  if (!match) return { category: "default", label: "", message: firstLine };

  const [, firstWord, rest] = match;
  if (/^v\d/i.test(firstWord)) {
    return { category: "version", label: firstWord, message: rest.replace(/^[:\s]+/, "") || firstWord };
  }
  const category = CATEGORY_KEYWORDS[firstWord.toLowerCase().replace(/[^a-z]/g, "")];
  if (category) return { category, label: LABELS[category], message: rest.replace(/^[:\s]+/, "") };
  return { category: "default", label: "", message: firstLine };
}

function formatRelativeDate(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const m = Math.floor(diffSec / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const w = Math.floor(d / 7);
  const mo = Math.floor(d / 30);
  const y = Math.floor(d / 365);
  if (diffSec < 60) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  if (h < 24) return `il y a ${h} h`;
  if (d < 7) return `il y a ${d} j`;
  if (w < 5) return `il y a ${w} sem.`;
  if (mo < 12) return `il y a ${mo} mois`;
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

/** Pseudo-hash stable à partir de l'id (affichage uniquement). */
function shortHash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

export default function GithubActivity() {
  const [events, setEvents] = useState<GithubEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/github")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: GithubEvent[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="f-mono overflow-hidden border border-ink text-[13px]">
      <div className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2.5 text-paper">
        <span>~/N0amG $ git log --all --oneline</span>
        <span className="hidden text-paper/50 sm:inline">api.github.com</span>
      </div>

      {events === null && (
        <ul aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex gap-4 border-b border-line px-4 py-4 last:border-0">
              <span className="h-3 w-16 animate-pulse bg-line" />
              <span className="h-3 flex-1 animate-pulse bg-line" />
            </li>
          ))}
        </ul>
      )}

      {events?.length === 0 && <p className="px-4 py-8 text-muted">Aucune activité récente trouvée.</p>}

      {events && events.length > 0 && (
        <ul>
          {events.map((ev, i) => {
            const { label, message } = parseCommitMessage(ev.message);
            return (
              <motion.li
                key={ev.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease }}
                className="border-b border-line last:border-0"
              >
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 gap-y-1 px-4 py-4 transition-colors hover:bg-ink hover:text-paper"
                >
                  <span className="text-signal">{shortHash(ev.id)}</span>
                  <span className="min-w-0">
                    <span className="text-muted group-hover:text-paper/60">({ev.repo})</span>{" "}
                    {label && <span className="mr-1 bg-signal px-1 text-on-signal">{label}</span>}
                    <span className="break-words">{message}</span>
                  </span>
                  <span className="flex items-center gap-2 whitespace-nowrap text-muted group-hover:text-paper/60">
                    {formatRelativeDate(ev.date)}
                    <ArrowUpRightIcon size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </a>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
