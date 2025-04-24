import { useState } from 'react'

// Composant Checkbox contrôlé, gère son propre état et notifie le parent
export default function Checkbox({
  checked: checkedProp = false,
  onChange,
  className = '',
  ...props
}) {
  const [checked, setChecked] = useState(checkedProp)

  // Gestion du changement de la case à cocher
  const handleChange = (e) => {
    setChecked(e.target.checked)
    if (onChange) onChange(e.target.checked)
  }

  return (
    // Label englobant l'input et l'icône SVG de validation
    <label className={`relative inline-flex items-center w-5 h-5 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="w-5 h-5 rounded border border-slate-500 bg-slate-900 appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 checked:bg-slate-500"
        {...props}
      />
      {/* Affichage de l'icône SVG si la case est cochée */}
      {checked && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-50">
            <rect width="24" height="24" rx="4" fill="currentColor" className="opacity-10" />
            <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </label>
  )
}

