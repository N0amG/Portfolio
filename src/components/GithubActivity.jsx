export default function GithubActivity({ events = [] }) {
	if (!events.length) return <div>Aucune activité récente trouvée.</div>;

	// Fonction pour extraire le premier mot du message (avant espace ou symbole)
	function getFirstWord(message) {
		if (!message) return '';
		const match = message.match(/^[^\s:;,!?\-\[\](){}]+/i);
		return match ? match[0] : '';
	}

	// Fonction pour retirer le premier mot du message
	function removeFirstWord(message) {
		if (!message) return '';
		// Retire le premier mot (avec ou sans symbole) + tous les espaces/symboles qui suivent
		return message.replace(/^[^\s:;,!?\-\[\](){}]+/i, '');
	}

	// Fonction pour déterminer la couleur du premier mot
	function getFirstWordColor(firstWord) {
		const word = firstWord.toLowerCase();
		if (word.includes('add') || word.includes('optimization') || word.includes('create')) return 'bg-green-600';
		if (word.includes('fix')) return 'bg-orange-400';
		if (word.includes('remove') || word.includes('delete')) return 'bg-red-600';
		if (word.includes('update') || word.includes('upgrade')) return 'bg-blue-600';
		if (/^v[\d.]+/i.test(firstWord)) return 'bg-slate-50 text-black';
		return 'bg-black';
	}

	// Fonction pour afficher la date au format "il y a X temps" ou au format local
	function displayDate(date) {
		const d = new Date(date);
		d.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
		const now = new Date();
		const diffMs = now - d;
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);
		const diffWeek = Math.floor(diffDay / 7);
		const diffMonth = Math.floor(diffDay / 30);
		const diffYear = Math.floor(diffDay / 365);

		if (diffSec < 60) return " il y a quelques secondes";
		if (diffMin < 60) return ` il y a ${diffMin} min${diffMin > 1 ? 's' : ''}`;
		if (diffHour < 24) return ` il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
		if (diffDay < 7) return ` il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
		if (diffWeek < 5) return ` il y a ${diffWeek} semaine${diffWeek > 1 ? 's' : ''}`;
		if (diffMonth < 12) return ` il y a ${diffMonth} mois`;
		if (diffYear >= 1) return ` il y a ${diffYear} an ${diffYear > 1 ? 's' : ''}`;
		return d.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
	}

	return (
		<ul className="github-activity-list flex flex-1 flex-col gap-4 p-2 h-full ">
			{events.map((event) => {
				const firstWord = getFirstWord(event.message);
				const color = getFirstWordColor(firstWord);
				const messageSansFirstWord = removeFirstWord(event.message);
				console.log(event.message, firstWord, messageSansFirstWord, color);
				return (
					<li key={event.id} className="github-commit-item bg-slate-800/70 rounded-lg p-4 shadow border border-slate-700 flex flex-col gap-2">
						<div className="flex flex-wrap items-center gap-1 mb-2">
							<span className="font-semibold text-indigo-400">{event.repo?.name}</span>
							<span className="text-xs text-slate-400">{displayDate(event.created_at)}</span>
						</div>
						<div className="flex items-start gap-2">
							<span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{firstWord}</span>
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
