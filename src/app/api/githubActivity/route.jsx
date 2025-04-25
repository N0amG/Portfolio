// pages/api/githubActivity.js
export default async function handler(req, res) {
	if (req.method !== 'GET') {
	  return res.status(405).json({ message: 'Method Not Allowed' });  // Retourner 405 si la méthode n'est pas GET
	}
  
	const token = process.env.GITHUB_TOKEN;  // Token dans les variables d'environnement
	const headers = {
	  Accept: 'application/vnd.github.v3+json',
	  Authorization: `Bearer ${token}`,  // Ajout du token dans les headers
	};
  
	// Récupérer les repos
	const repoRes = await fetch('https://api.github.com/users/N0amG/repos?per_page=100', { headers });
	let repos = [];
	if (repoRes.ok) {
	  repos = await repoRes.json();
	}
  
	// Récupérer les commits pour chaque repo
	let allCommits = [];
	for (const repo of repos) {
	  const commitsRes = await fetch(`https://api.github.com/repos/N0amG/${repo.name}/commits?per_page=2`, { headers });
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
  
	allCommits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	const events = allCommits.slice(0, 6 * 2);
  
	// Retourner les événements au client
	res.status(200).json({ events });
  }
  