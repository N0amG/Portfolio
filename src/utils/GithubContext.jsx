'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const GithubContext = createContext();

const CACHE_KEY = 'github_activity_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function GithubProvider({ children }) {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const username = 'N0amG';

	useEffect(() => {
		// 1. Vérifier le localStorage d'abord
		const cachedData = localStorage.getItem(CACHE_KEY);
		if (cachedData) {
			try {
				const { events: cachedEvents, timestamp } = JSON.parse(cachedData);
				setEvents(cachedEvents);
				setLoading(false);
				
				// Si le cache a moins de 5 minutes, on ne refetch pas
				if (Date.now() - timestamp < CACHE_DURATION) {
					console.log('Utilisation du cache (moins de 5 minutes)');
					return;
				}
				console.log('Cache expiré, refetch des données...');
			} catch (error) {
				console.error('Erreur lors de la lecture du cache:', error);
			}
		}

		// 2. Fetch se lance seulement si pas de cache ou cache expiré
		async function fetchGithubActivity() {
			try {
				// Récupère la liste des repos publics
				const repoRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
				
				console.log('Status de la réponse GitHub:', repoRes.status);
				
				if (!repoRes.ok) {
					const errorText = await repoRes.text();
					console.error('Erreur lors de la récupération des repos GitHub:', repoRes.status, errorText);
					setLoading(false);
					return;
				}

				const repos = await repoRes.json();
				console.log(`${repos.length} repos trouvés`);
				
				// Pour chaque repo, récupère les commits les plus récents
				let allCommits = [];
				for (const repo of repos.slice(0, 20)) {
					try {
						const commitsRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=2`);
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
					} catch (error) {
						console.warn(`Erreur pour le repo ${repo.name}:`, error);
						// Continue avec les autres repos même si un échoue
					}
				}

				console.log(`${allCommits.length} commits trouvés au total`);

				// Trie les commits par date décroissante
				allCommits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				// Limite à 12 commits
				const finalEvents = allCommits.slice(0, 12);
				
				// 3. Sauvegarder dans localStorage avec timestamp
				localStorage.setItem(CACHE_KEY, JSON.stringify({
					events: finalEvents,
					timestamp: Date.now()
				}));
				console.log('Données sauvegardées dans le cache');
				
				setEvents(finalEvents);
			} catch (error) {
				console.error("Erreur lors de la récupération de l'activité GitHub : ", error);
			} finally {
				setLoading(false);
			}
		}

		fetchGithubActivity();
	}, []);

	return (
		<GithubContext.Provider value={{ events, loading }}>
			{children}
		</GithubContext.Provider>
	);
}

export function useGithub() {
	const context = useContext(GithubContext);
	if (!context) {
		throw new Error('useGithub doit être utilisé dans un GithubProvider');
	}
	return context;
}
