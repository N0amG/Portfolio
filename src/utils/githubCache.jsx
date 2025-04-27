// Module de cache pour les données GitHub
// Ce module permet de stocker en mémoire les données récupérées depuis l'API GitHub
// et de les actualiser automatiquement toutes les 5 minutes.

const CACHE_DURATION = 60 * 1000; // 5 minutes
let cache = {
  events: [], // Stocke les commits récupérés
  lastFetch: 0, // Timestamp du dernier fetch
  loading: false, // Indique si un fetch est en cours
};

// Fonction qui récupère les données depuis l'API GitHub
async function fetchGithubData(repoNum = 6, commitPerRepo = 1) {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Récupère la liste des repos publics
  const repoRes = await fetch('https://api.github.com/users/N0amG/repos?per_page=100', { headers });
  let repos = [];
  if (repoRes.ok) {
    repos = await repoRes.json();
  }

  // Pour chaque repo, récupère les commits les plus récents
  let allCommits = [];
  for (const repo of repos) {
    const commitsRes = await fetch(`https://api.github.com/repos/N0amG/${repo.name}/commits?per_page=${commitPerRepo}`, { headers });
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      allCommits.push(...commits.map(commit => ({
        id: commit.sha,
        repo: { name: repo.name },
        created_at: commit.commit.author.date,
        message: commit.commit.message,
        url: commit.html_url,
      })));
    }
  }

  // Trie les commits par date décroissante
  allCommits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // Limite le nombre de commits retournés
  return allCommits.slice(0, repoNum * commitPerRepo);
}

// Met à jour le cache en mémoire avec les dernières données GitHub
async function updateCache(repoNum, commitPerRepo) {
  if (cache.loading) return;
  cache.loading = true;
  try {
    const events = await fetchGithubData(repoNum, commitPerRepo);
    cache.events = events;
    cache.lastFetch = Date.now();
  } catch (e) {
    // Optionnel : log l’erreur
  } finally {
    cache.loading = false;
  }
}

// Lance l'actualisation automatique du cache toutes les 5 minutes
function startCacheUpdater(repoNum = 6, commitPerRepo = 1) {
  updateCache(repoNum, commitPerRepo);
  setInterval(() => updateCache(repoNum, commitPerRepo), CACHE_DURATION);
}

// Fonction à utiliser pour récupérer les données en cache
export async function getGithubEvents(repoNum = 6, commitPerRepo = 1) {
  // Si le cache est trop vieux ou vide, on attend la mise à jour
  if ((Date.now() - cache.lastFetch > CACHE_DURATION || cache.events.length === 0) && !cache.loading) {
    await updateCache(repoNum, commitPerRepo);
  } else if (cache.loading) {
    // Si une mise à jour est déjà en cours, on attend qu'elle se termine
    while (cache.loading) {
      await new Promise(res => setTimeout(res, 100));
    }
  }
  return cache.events;
}

export { startCacheUpdater };
