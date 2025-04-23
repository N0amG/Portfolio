export default function BlurEffect({
	className = '',
	color = 'bg-teal-400',
	rotation = 0,
}) {
	return (
		<div
			className={`absolute w-96 h-96 opacity-40 pointer-events-none ${className}`}
			style={{
				clipPath:
					'polygon(54% 7%, 68% 29%, 93% 20%, 100% 70%, 88% 91%, 55% 95%, 44% 58%, 24% 69%, 6% 38%, 0 5%)',
				transform: `rotate(${rotation}deg)`,
				background: 'linear-gradient(90deg, rgba(0, 255, 255, 1) 0%, rgba(0, 255, 255, 0.5) 100%)',
			}}
		/>
	)
}
