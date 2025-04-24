import React from 'react'

export default function Avatar({ src, className }) {
	return (
		<div
			className={`avatar relative flex items-center justify-center w-40 h-40 min-w-40 min-h-40
						rounded-full overflow-hidden border-4 select-none ${className}`} >
			<img
				src='/assets/noam.webp'
				alt='noam_avatar'
				className='object-cover w-full h-full bg-slate-50'
			/>
		</div>
	)
}
