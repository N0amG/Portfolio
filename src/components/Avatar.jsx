import React from 'react'

export default function Avatar({ src, className }) {
	// Composant Avatar affichant une image ronde avec bordure
	return (
		// Conteneur de l'avatar, centré et arrondi
		<div
			className={`avatar relative flex items-center justify-center w-full h-gull min-w-40 min-h-40
						rounded-full overflow-hidden border-4 select-none ${className}`} >
			{/* Image de l'avatar (par défaut /assets/noam.webp) */}
			<img
				src='/assets/noam.webp'
				alt='noam_avatar'
				className='object-cover w-full h-full bg-slate-50'
			/>
		</div>
	)
}
