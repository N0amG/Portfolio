import GithubActivity from './GithubActivity';

export default async function GithubActivityServer({ repoNum = 5, commitPerRepo = 1, ...props }) {
	const token = process.env.GITHUB_TOKEN;
	const headers = {
		Accept: 'application/vnd.github.v3+json',
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};

	// 1. Récupérer les repoNum repos publics les plus récents
	const repoRes = await fetch('https://api.github.com/users/N0amG/repos?per_page=' + repoNum + '&sort=updated', { headers, cache: 'no-store' });
	let repos = [];
	if (repoRes.ok) {
		repos = await repoRes.json();
	}

	// 2. Pour chaque repo, récupérer les commitPerRepo commits les plus récents
	let allCommits = [];
	for (const repo of repos) {
		const commitsRes = await fetch(`https://api.github.com/repos/N0amG/${repo.name}/commits?per_page=${commitPerRepo}`, { headers, cache: 'no-store' });
		if (commitsRes.ok) {
			const commits = await commitsRes.json();
			allCommits.push(...commits.map(commit => ({
				id: commit.sha,
				repo: { name: repo.name },
				created_at: commit.commit.author.date,
				message: commit.commit.message,
				url: commit.html_url
			})));
		}
	}

	// 3. Trier tous les commits par date décroissante et ne garder que les repoNum*commitPerRepo plus récents
	allCommits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	const events = allCommits.slice(0, repoNum * commitPerRepo);

	return <GithubActivity events={events} {...props} />;
}
