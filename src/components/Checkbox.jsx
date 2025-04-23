import { useState } from 'react'

export default function Checkbox({
  checked: checkedProp = false,
  onChange,
  className = '',
  ...props
}) {
  const [checked, setChecked] = useState(checkedProp)

  const handleChange = (e) => {
    setChecked(e.target.checked)
    if (onChange) onChange(e.target.checked)
  }

  return (
    <label className={`relative inline-flex items-center w-5 h-5 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="w-5 h-5 rounded border border-slate-500 bg-slate-900 appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 checked:bg-slate-500"
        {...props}
      />
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

