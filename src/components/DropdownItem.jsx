import Icon from './Icon'

// DropdownItem : titre, icône, couleur icône, couleur titre
export default function DropdownItem({
	id,
	title,
	iconPath,
	activeId = '',
	onClick,
	className = '',
	active = activeId === id,
}) {
	const iconColor = active ? 'text-slate-50' : 'text-slate-700'

	return (
		<button
			className={`flex items-center justify-end gap-2 w-full px-2 py-2 rounded transition-colors select-none ${
				active
					? 'bg-slate-700 text-slate-50'
					: 'hover:bg-slate-800 text-slate-500'
			} ${className}`}
			onClick={() => onClick(id)}
			type='button'
		>
			{iconPath && 
				<Icon
					path={iconPath}
					color={iconColor}
					className='w-[22px] h-[22px]'/>
			}
			<span className='flex-1 text-left w-fit'>{title}</span>
		</button>
	)
}
