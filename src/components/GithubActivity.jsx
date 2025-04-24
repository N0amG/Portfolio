import { useEffect, useState } from 'react'

/* Github activity component */

export default function GithubActivity({ number = 3 }) {
	const [events, setEvents] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		fetch(`https://api.github.com/users/N0amG/events?per_page=${number}`, {
			headers: {
				Accept: 'application/vnd.github.v3+json',
			},
		})
			.then((res) => {
				if (!res.ok)
					throw new Error(
						'Erreur lors de la récupération des données GitHub'
					)
				return res.json()
			})
			.then((data) => {
				const pushEvents = data.filter(
					(event) => event.type === 'PushEvent'
				)
				setEvents(pushEvents.slice(0, number))
				setLoading(false)
			})
			.catch((err) => {
				setError(err.message)
				setLoading(false)
			})
	}, [number])

	if (loading) return <div>Chargement de l'activité GitHub...</div>
	if (error) return <div>Erreur : {error}</div>
	console.log(events)
	return (
		<ul className='flex flex-col items-start justify-start w-full h-full p-5 overflow-y-auto bg-slate-800 text-slate-400'>
			{events.map((event) => (
				<li key={event.id} className='ml-5 mb-10'>
					{event.repo?.name} -{' '} {new Date(event.created_at).toLocaleString()}
					{event.payload?.commits?.length > 0 && (
						<ul>
							{event.payload.commits.map((commit, index) => (
								<li key={index} className='ml-6'>
									{commit.message}
								</li>
							))}
						</ul>
					)}
				</li>
			))}
		</ul>
	)
}
