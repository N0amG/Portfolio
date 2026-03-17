import { NextResponse } from "next/server";

const GITHUB_USERNAME = "N0amG";
const REPO_COUNT = 20;
const COMMITS_PER_REPO = 1;
const EVENT_LIMIT = 4;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  events: GithubEvent[];
  timestamp: number;
}

export interface GithubEvent {
  id: string;
  repo: string;
  date: string;
  message: string;
  url: string;
}

const cache: CachedData =
  ((globalThis as Record<string, unknown>).githubCache as CachedData) ?? {
    events: [],
    timestamp: 0,
  };
(globalThis as Record<string, unknown>).githubCache = cache;

async function fetchGithubEvents(): Promise<GithubEvent[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const repoRes = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
    { headers, cache: "no-store" }
  );

  if (!repoRes.ok) return [];

  const repos = await repoRes.json();

  const allCommits: GithubEvent[] = [];

  for (const repo of repos.slice(0, REPO_COUNT)) {
    try {
      const commitsRes = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/commits?per_page=${COMMITS_PER_REPO}`,
        { headers, cache: "no-store" }
      );
      if (commitsRes.ok) {
        const commits = await commitsRes.json();
        for (const commit of commits) {
          allCommits.push({
            id: commit.sha,
            repo: repo.name,
            date: commit.commit.author.date,
            message: commit.commit.message,
            url: commit.html_url,
          });
        }
      }
    } catch {
      // Skip failed repos
    }
  }

  allCommits.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return allCommits.slice(0, EVENT_LIMIT);
}

export async function GET() {
  if (cache.timestamp && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.events);
  }

  const events = await fetchGithubEvents();
  cache.events = events;
  cache.timestamp = Date.now();

  return NextResponse.json(events);
}
