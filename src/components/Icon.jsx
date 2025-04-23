export default function Icon({ path, size = 18, color, className = '' }) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			viewBox='0 0 24 24'
			fill='currentColor'
			width={size}
			height={size}
			className={
				className +
				`${color ? color : ' text-slate-500'} hover:text-slate-50`
			}
		>
			<path d={path} />
		</svg>
	)
}
