'use client'
import { useState } from 'react';

export default function InputField({placeholder = 'Standard input!', label = '', error = false, className, value, onChange}) {
	// Composant champ de saisie stylisé avec gestion du focus et de l'erreur
	const [focus, setFocus] = useState(false);
	return (
		// Conteneur principal avec largeur maximale personnalisable
		<div className={`w-full ${className}`}>
			{/* Affichage du label si fourni */}
			{label && <label className={`block mb-1 ${focus ? 'text-slate-200' : 'text-slate-400'}`}>{label}</label>}
			{/* Zone d'entrée stylisée, change de couleur selon focus ou erreur */}
			<div className={`input-field flex items-center h-[50px] justify-center rounded-lg px-2 border transition-colors
			${error ? 'bg-red-500/30 border-red-500' : focus ? 'border-slate-50' : 'bg-slate-950 border-slate-700'} text-slate-50`}>
				<input
					type='text'
					placeholder={placeholder}
					className="border-none outline-none bg-transparent w-full text-slate-400 text-sm select-none"
					onFocus={() => setFocus(true)}
					onBlur={() => setFocus(false)}
					value={value}
					onChange={onChange}
				/>
				{/* Affichage de l'icône d'erreur si error=true */}
				{error && (
					<span className="ml-2 flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[24px] h-[24px] text-red-500">
							<path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z"></path>
						</svg>
					</span>
				)}
			</div>
			{/* Message d'erreur sous le champ si error=true */}
			{error && <span className="text-red-500 text-sm mt-2">Something went wrong</span>}
		</div>
	)
}
