'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const GithubContext = createContext();

export function GithubProvider({ children }) {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const username = 'N0amG';

	useEffect(() => {
		// Fetch se lance dès le chargement de l'application
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
				setEvents(allCommits.slice(0, 12));
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
