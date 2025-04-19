'use client'

export default function Banner() {
	const handleClick = (event) => {
		const button = event.target.closest('#scroll-to-about');
		if (button) {
			const aboutSection = document.getElementById('about');
			if (aboutSection) {
				aboutSection.scrollIntoView({ behavior: 'smooth' });
			}
		}
	}
	return (
		<button
			className='relative flex flex-col items-center justify-center w-full h-screen bg-transparent text-foreground select-none z-1'
			onClick={handleClick}
			id='scroll-to-about'
		>
			<h1 className='absolute text-6xl font-bold text-primary p-4 rounded-xl z-0'>
				{'<Noam Guez />'}
			</h1>
		</button>
	)
}
