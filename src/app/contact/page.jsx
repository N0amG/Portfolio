'use client'
import { useState, useRef, useEffect } from 'react'
import Dropdown from '@/components/Dropdown'
import Icon from '@/components/Icon'
import InputField from '@/components/InputField'
import TextAreaField from '@/components/TextAreaField'

// Page de contact avec informations et invitation à échanger
export default function Contact({ className }) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const codeRef = useRef(null)
	const [lineCount, setLineCount] = useState(12)
	const [isFormError, setIsFormError] = useState(false)
	const [isSuccess, setIsSuccess] = useState(false)
	const [rateLimitError, setRateLimitError] = useState(false)

	useEffect(() => {
		if (codeRef.current) {
			const codeEl = codeRef.current
			const style = window.getComputedStyle(codeEl)
			const lineHeight = parseFloat(style.lineHeight)
			const height = codeEl.scrollHeight
			const count = Math.round(height / lineHeight)
			setLineCount(count)
		}
	}, [name, email, message])

	// Fonction pour gérer l'envoi du formulaire de contact
	const handleSubmit = async (e) => {
		e.preventDefault()
		setRateLimitError(false)
		const res = await fetch('/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, email, message }),
		})
		if (res.ok) {
			setName('')
			setEmail('')
			setMessage('')
			// Optionnel : afficher un message de succès
			setIsFormError(false)
			setIsSuccess(true)
		} else {
			const data = await res.json()
			if (res.status === 429) {
				setRateLimitError(true)
			}
			setIsFormError(true)
			setIsSuccess(false)
		}
	}

	// Conteneur principal de la page contact
	return (
		// Conteneur principal de la colonne gauche et centrale
		<div className={`flex items-start w-full h-full ${className} text-sm`}>
			{/* Colonne de gauche : menu déroulant (Dropdown) */}
			<div className='left-container flex flex-col items-center justify-start h-full overflow-y-auto scrollbar-custom min-w-[235px] max-w-[301px] w-full'>
				{/* Titre du menu déroulant (Dropdown) */}
				<Dropdown title='_contacts' isLabel={true} className='h-full'>
					<span
						className={`flex items-center justify-end gap-2 py-2 pl-2 mr-2 rounded transition-colors `}
					>
						{/* Icône à gauche du titre si fourni */}
						<Icon
							path={
								'M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM12.0606 11.6829L5.64722 6.2377L4.35278 7.7623L12.0731 14.3171L19.6544 7.75616L18.3456 6.24384L12.0606 11.6829Z'
							}
							className='w-[22px] h-[22px]'
						/>
						<span className='flex-1 text-left w-fit text-slate-500 hover:text-slate-50'>
							{'noamguez0@gmail.com'}
						</span>
					</span>
					<span
						className={`flex items-center justify-end gap-2 py-2 pl-2 mr-2 rounded transition-colors `}
					>
						{/* Icône à gauche du titre si fourni */}
						<Icon
							path={
								'M21 16.42V19.9561C21 20.4811 20.5941 20.9167 20.0705 20.9537C19.6331 20.9846 19.2763 21 19 21C10.1634 21 3 13.8366 3 5C3 4.72371 3.01545 4.36687 3.04635 3.9295C3.08337 3.40588 3.51894 3 4.04386 3H7.5801C7.83678 3 8.05176 3.19442 8.07753 3.4498C8.10067 3.67907 8.12218 3.86314 8.14207 4.00202C8.34435 5.41472 8.75753 6.75936 9.3487 8.00303C9.44359 8.20265 9.38171 8.44159 9.20185 8.57006L7.04355 10.1118C8.35752 13.1811 10.8189 15.6425 13.8882 16.9565L15.4271 14.8019C15.5572 14.6199 15.799 14.5573 16.001 14.6532C17.2446 15.2439 18.5891 15.6566 20.0016 15.8584C20.1396 15.8782 20.3225 15.8995 20.5502 15.9225C20.8056 15.9483 21 16.1633 21 16.42Z'
							}
							className='w-[22px] h-[22px]'
						/>
						<span className='flex-1 text-left w-fit text-slate-500 hover:text-slate-50'>
							{'+33611918062'}
						</span>
					</span>
				</Dropdown>
			</div>
			{/* Colonne centrale : affichage du contenu sélectionné */}
			<div className='right-left-container flex items-start justify-start w-full min-w-[600px] h-full max-h-full mt-[38px]'>
				<div
					id='form-container'
					className='flex flex-col items-center justify-center text-justify text-lg text-slate-400 border-t-2 border-r-2 border-slate-800 w-1/2 overflow-y-auto min-h-[400px] h-[calc(100%-38px)] scrollbar-custom'
				>
					<form
						id='form'
						onSubmit={handleSubmit}
						className='flex flex-col items-center justify-center w-[70%] h-full gap-5'
					>
						<h2 className='flex text-2xl text-indigo-500 font-bold mb-1 mt-3'>
							Contactez-moi
						</h2>
						<InputField
							placeholder='Prénom Nom'
							type='text'
							label='_name'
							error={isFormError}
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<InputField
							placeholder='exemple@gmail.com'
							label='_email'
							type='email'
							error={isFormError}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<TextAreaField
							placeholder='Votre message juste ici ...'
							label='_message'
							error={isFormError}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
						/>
						<div className='flex flex-col justify-start w-full gap-2'>
							<button
								id='submit-button'
								disabled={rateLimitError}
								className={`flex flex-nowrap px-4 py-2 mt-3 mb-1 rounded-lg self-start bg-slate-600 text-slate-50 text-sm font-mono hover:bg-slate-500 transition ${
									rateLimitError
										? 'opacity-50 cursor-not-allowed'
										: ''
								}`}
							>
								envoyez le message
							</button>
							{isSuccess && (
								<span
									id='success-message'
									className='flex flex-wrap text-green-500 text-sm'
								>
									Message envoyé avec succès !
								</span>
							)}
							{rateLimitError && (
								<span className='flex flex-wrap text-red-500 text-sm'>
									Limite d'envoi atteinte. Merci de patienter
									5 minutes avant de réessayer.
								</span>
							)}
						</div>
					</form>
				</div>
				<div
					id='code-form'
					className='flex flex-col max-h-[calc(100%-38px)] border-t-2 border-slate-800 w-1/2 overflow-y-auto scrollbar-custom min-h-[400px]'
				>
					{/* Affichage stylisé du code comme dans l'image */}
					<pre className='relative text-sm font-mono p-4 select-text text-slate-400 h-full overflow-y-auto scrollbar-custom'>
						<div className='flex w-full'>
							<div className='flex flex-col items-end mx-4 max-h-[calc(100%-300px)] overflow-y-auto scrollbar-custom'>
								{Array.from({ length: lineCount }, (_, i) => (
									<span key={i + 1}>{i + 1}</span>
								))}
							</div>
							<code
								ref={codeRef}
								style={{
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									display: 'block',
								}}
								className='max-h-[calc(100%-300px)] overflow-y-auto flex-1'
							>
								<span className='text-purple-400'>const</span>{' '}
								<span>button</span>
								<span className='text-purple-400'>{' = '}</span>
								<span className='text-indigo-500'>
									document.querySelector
								</span>
								{'('}
								<span className='text-orange-300'>
									'#sendBtn'
								</span>
								{');'}
								<br /> <br />
								<span className='text-purple-400'>
									const
								</span>{' '}
								<span>message</span>
								<span className='text-purple-400'>{' = '}</span>
								<span>{'{'}</span>
								<br />
								<span className='text-indigo-500'>
									{'\t'}name
								</span>
								<span>{': '}</span>
								<span className='text-orange-300 text-wrap'>
									"{name}"
								</span>
								<span>,</span>
								<br />
								<span className='text-indigo-500'>
									{'\t'}email
								</span>
								<span>{': '}</span>
								<span className='text-orange-300 text-wrap'>
									"{email}"
								</span>
								<span>,</span>
								<br />
								<span className='text-indigo-500'>
									{'\t'}message
								</span>
								<span>{': '}</span>
								<span className='text-orange-300 text-wrap'>
									"{message}"
								</span>
								<span>,</span>
								<br />
								<span className='text-indigo-500'>
									{'\t'}date
								</span>
								<span>{': '}</span>
								<span className='text-orange-300'>
									"Thu 21 Apr"
								</span>
								<br />
								<span>{'}'}</span>
								<br />
								<br />
								<span className='text-indigo-500'>
									button.addEventListener
								</span>
								(
								<span className='text-orange-300'>'click'</span>
								, () =&gt; &#123;
								<br />
								{'\t'}
								<span className='text-indigo-500'>
									form.send
								</span>
								<span>{'(message);'}</span>
								<br />
								<span>{'}'}</span>)
							</code>
						</div>
					</pre>
				</div>
				<span className='right-right-container flex items-start pt-[10px] justify-center min-w-[40px] max-h-[calc(100%-38px)] border-t-2 border-l-2 h-full border-slate-800'>
					<div className='bg-slate-500 w-[26px] h-[6px]' />
				</span>
			</div>
		</div>
	)
} // Fin de la fonction Contact
