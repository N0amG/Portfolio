export default function GithubActivity({ events = [] }) {
	if (!events.length) return <div>Aucune activité récente trouvée.</div>;

	// Fonction pour extraire le premier mot du message (avant espace ou symbole)
	function getFirstWord(message) {
		if (!message) return '';
		const match = message.match(/^[^\s:;,.!?\-\[\](){}]+/i);
		return match ? match[0] : '';
	}

	// Fonction pour retirer le premier mot du message
	function removeFirstWord(message) {
		if (!message) return '';
		// Retire le premier mot (avec ou sans symbole) + tous les espaces/symboles qui suivent
		return message.replace(/^[^\s:;,.!?\-\[\](){}]+/i, '');
	}

	// Fonction pour déterminer la couleur du premier mot
	function getFirstWordColor(firstWord) {
		const word = firstWord.toLowerCase();
		if (word.includes('add')) return 'bg-green-600';
		if (word.includes('fix')) return 'bg-orange-400';
		if (word.includes('remove') || word.includes('delete')) return 'bg-red-600';
		return 'bg-rose-500';
	}

	return (
		<ul className="github-activity-list flex flex-col gap-4 p-2">
			{events.map((event) => {
				const firstWord = getFirstWord(event.message);
				const color = getFirstWordColor(firstWord);
				const messageSansFirstWord = removeFirstWord(event.message);
				console.log(event.message, firstWord, messageSansFirstWord, color);
				return (
					<li key={event.id} className="github-commit-item bg-slate-800/70 rounded-lg p-4 shadow border border-slate-700 flex flex-col gap-1">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-semibold text-indigo-400">{event.repo?.name}</span>
							<span className="text-xs text-slate-400">{new Date(event.created_at).toLocaleString()}</span>
						</div>
						<div className="flex items-start gap-2">
							<span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${color}`}>{firstWord}</span>
							<span className="text-slate-200 font-mono text-sm break-words whitespace-pre-line">{messageSansFirstWord}</span>
						</div>
						{event.url && (
							<a href={event.url} target="_blank" rel="noopener noreferrer" className="text-rose-300 hover:underline text-sm mt-1 w-fit">Voir sur GitHub</a>
						)}
					</li>
				)
			})}
		</ul>
	);
}
