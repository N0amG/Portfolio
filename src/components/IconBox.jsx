import Icon from './Icon'

// IconBox : icône, couleur icône, couleur titre, titre, className
export default function IconBox({
	iconPath,
	bgColor = 'bg-slate-700',
	iconColor = 'text-slate-900',
	className = '',
}) {
	return (
		<Icon path={iconPath} className={`w-[40px] h-[40px] ${iconColor} ${className} transition-colors ease-in-out rounded-md hover:bg-slate-700`} />
	)
}
