'use client'
import NameTitle from '@/components/NameTitle'
import { useEffect } from 'react'

export default function Banner() {
		const handleClick = (event) => {
			// Only scroll if the clicked element has a specific id or class, e.g., 'scroll-to-about'
			if (event.target && event.target.id === 'scroll-to-about') {
				const aboutSection = document.getElementById('about');
				if (aboutSection) {
					aboutSection.scrollIntoView({ behavior: 'smooth' });
				}
			}
		};
	return (
		<button className='flex flex-col items-center justify-center w-full h-screen bg-background text-foreground select-none' onClick={handleClick} id='scroll-to-about'>
				<NameTitle />
		</button>
	)
}
