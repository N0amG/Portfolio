import GithubActivity from './GithubActivity';
import { getGithubEvents, startCacheUpdater } from '@/utils/githubCache';

// Démarre l'actualisation du cache au premier appel (singleton)
let cacheStarted = false;

export default async function GithubActivityServer({ repoNum = 6, commitPerRepo = 2, ...props }) {
	if (!cacheStarted) {
		startCacheUpdater(repoNum, commitPerRepo);
		cacheStarted = true;
	}
	const events = await getGithubEvents(repoNum, commitPerRepo);
	return <GithubActivity events={events} {...props} />;
}
