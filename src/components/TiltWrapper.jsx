'use client'
import { useRef, useState } from 'react'
import { useViewport } from '@/utils/ViewportContext'

export default function TiltWrapper({ children, className = '', style = {}, intensity=15}) {
	const cardRef = useRef(null)
	const [tilt, setTilt] = useState({ x: 0, y: 0 })
	const { isMobile } = useViewport()

	function handleMouseMove(e) {
		if (isMobile) return
		const card = cardRef.current
		if (!card) return
		const rect = card.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top
		const centerX = rect.width / 2
		const centerY = rect.height / 2
		const rotateX = ((y - centerY) / centerY) * intensity
		const rotateY = ((x - centerX) / centerX) * intensity
		setTilt({ x: -rotateX, y: rotateY })
	}

	function handleMouseLeave() {
		if (isMobile) return
		setTilt({ x: 0, y: 0 })
	}

	return (
		<div
			ref={cardRef}
			onMouseMove={isMobile ? undefined : handleMouseMove}
			onMouseLeave={isMobile ? undefined : handleMouseLeave}
			style={{
				transform: isMobile
					? undefined
					: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`,
				transition:
					isMobile
						? undefined
						: tilt.x === 0 && tilt.y === 0
						? 'transform 0.3s cubic-bezier(.23,1.02,.32,1)'
						: 'transform 0.08s',
				...style,
			}}
			className={className}
		>
			{children}
		</div>
	)
}
