'use client'

import Dropdown from '@/components/Dropdown'
import DropdownItem from '@/components/DropdownItem'
import Icon from '@/components/Icon'
import { useState } from 'react'

export default function AboutClient() {
	const [selectedId, setSelectedId] = useState('bio-1')

	const itemContents = {
		'bio-1': [
			'About me',
			'I have 5 years of experience in web',
			'development lorem ipsum dolor sit amet,',
			'consectetur adipiscing elit, sed do eiusmod',
			'tempor incididunt ut labore et dolore',
			'magna aliqua. Ut enim ad minim veniam,',
			'quis nostrud exercitation ullamco laboris',
			'nisi ut aliquip ex ea commodo consequat.',
			'Duis aute irure dolor in reprehenderit in',
			'',
			'Duis aute irure dolor in reprehenderit in',
			'voluptate velit esse cillum dolore eu fugiat',
			'nulla pariatur. Excepteur sint occaecat',
			'officia deserunt mollit anim id est laborum.',
		],
		'interests-1': [
			'I love video games, I play a lot of different games,',
			'but I especially like RPGs and strategy games.',
			'I also like to play board games with my friends.',
		],
		'interests-2': [
			'I love coding, I spend a lot of time coding and learning new technologies.',
			'I am currently learning React and Next.js.',
		],
		'interests-3': [
			'I love science, I am very interested in physics and mathematics.',
			'I also like to read books on these subjects.',
			'I am currently reading a book on quantum physics.',
			'I am also interested in astronomy and cosmology.',
			'I like to watch documentaries on these subjects.',
			'I am also interested in biology and chemistry.',
			'I like to watch documentaries on these subjects.',
		],
		'studies-1': [
			'I am currently in a 3rd year of computer science at the University of Paris 12.',
			'I have already done several internships in web development',
			'and I am currently looking for an internship in this field.',
		],
		'studies-2': [
			'I graduated from high school in 2021 with a scientific baccalaureate.',
			'I was in the mathematics and physics specialty.',
			'I also took the computer science option.',
		],
	}

	return (
		// Conteneur principal de la colonne gauche et centrale
		<div className='flex items-start justify-start w-full h-full'>
			{/* Colonne de gauche : menu déroulant (Dropdown) */}
			<div className='left-container flex flex-col items-start justify-start h-full overflow-y-auto scrollbar-custom min-w-[250px] w-1/2'>

				<Dropdown title='personnal-info' isLabel={true} className=''>
					<Dropdown title='bio' iconColor='text-rose-400' isOpen={true}>
						<DropdownItem id='bio-1' title='about-me' iconPath='M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z' activeId={selectedId} onClick={setSelectedId} />
					</Dropdown>
					<Dropdown title='interests' iconColor='text-teal-400'>
						<DropdownItem id='interests-1' title='video-games' iconPath='M24 12L18.3431 17.6569L16.9289 16.2426L21.1716 12L16.9289 7.75736L18.3431 6.34315L24 12ZM2.82843 12L7.07107 16.2426L5.65685 17.6569L0 12L5.65685 6.34315L7.07107 7.75736L2.82843 12ZM9.78845 21H7.66009L14.2116 3H16.3399L9.78845 21Z' activeId={selectedId} onClick={setSelectedId} />
						<DropdownItem id='interests-2' title='coding' iconPath='M17 4C20.3137 4 23 6.68629 23 10V14C23 17.3137 20.3137 20 17 20H7C3.68629 20 1 17.3137 1 14V10C1 6.68629 3.68629 4 7 4H17ZM17 6H7C4.8578 6 3.10892 7.68397 3.0049 9.80036L3 10V14C3 16.1422 4.68397 17.8911 6.80036 17.9951L7 18H17C19.1422 18 20.8911 16.316 20.9951 14.1996L21 14V10C21 7.8578 19.316 6.10892 17.1996 6.0049L17 6ZM10 9V11H12V13H9.999L10 15H8L7.999 13H6V11H8V9H10ZM18 13V15H16V13H18ZM16 9V11H14V9H16Z' activeId={selectedId} onClick={setSelectedId} />
						<DropdownItem id='interests-3' title='sciences' iconPath='M17 4C20.3137 4 23 6.68629 23 10V14C23 17.3137 20.3137 20 17 20H7C3.68629 20 1 17.3137 1 14V10C1 6.68629 3.68629 4 7 4H17ZM17 6H7C4.8578 6 3.10892 7.68397 3.0049 9.80036L3 10V14C3 16.1422 4.68397 17.8911 6.80036 17.9951L7 18H17C19.1422 18 20.8911 16.316 20.9951 14.1996L21 14V10C21 7.8578 19.316 6.10892 17.1996 6.0049L17 6ZM10 9V11H12V13H9.999L10 15H8L7.999 13H6V11H8V9H10ZM18 13V15H16V13H18ZM16 9V11H14V9H16Z' activeId={selectedId} onClick={setSelectedId} />

					</Dropdown>
					<Dropdown title='studies' iconColor='text-indigo-500'>
						<DropdownItem id='studies-1' title='higher-education' iconPath='M4 16H20V5H4V16ZM13 18V20H17V22H7V20H11V18H2.9918C2.44405 18 2 17.5511 2 16.9925V4.00748C2 3.45107 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44892 22 4.00748V16.9925C22 17.5489 21.5447 18 21.0082 18H13Z' activeId={selectedId} onClick={setSelectedId} />
						<DropdownItem id='studies-2' title='high-school' iconPath='M12 0.585693L18 6.58569V9H22V19H23V21H1V19H2V9H6V6.58569L12 0.585693ZM18 19H20V11H18V19ZM6 11H4V19H6V11ZM8 7.41412V18.9999H11V12H13V18.9999H16V7.41412L12 3.41412L8 7.41412Z' activeId={selectedId} onClick={setSelectedId} />
					</Dropdown>
				</Dropdown>
				<Dropdown title='contacts' isLabel={true} className='h-full'>
					<DropdownItem id='contacts-1' title='noamguez0@gmail.com' iconPath='M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM12.0606 11.6829L5.64722 6.2377L4.35278 7.7623L12.0731 14.3171L19.6544 7.75616L18.3456 6.24384L12.0606 11.6829Z' onClick={() => {}} />
					<DropdownItem id='contacts-2' title='+33611918062' iconPath='M21 16.42V19.9561C21 20.4811 20.5941 20.9167 20.0705 20.9537C19.6331 20.9846 19.2763 21 19 21C10.1634 21 3 13.8366 3 5C3 4.72371 3.01545 4.36687 3.04635 3.9295C3.08337 3.40588 3.51894 3 4.04386 3H7.5801C7.83678 3 8.05176 3.19442 8.07753 3.4498C8.10067 3.67907 8.12218 3.86314 8.14207 4.00202C8.34435 5.41472 8.75753 6.75936 9.3487 8.00303C9.44359 8.20265 9.38171 8.44159 9.20185 8.57006L7.04355 10.1118C8.35752 13.1811 10.8189 15.6425 13.8882 16.9565L15.4271 14.8019C15.5572 14.6199 15.799 14.5573 16.001 14.6532C17.2446 15.2439 18.5891 15.6566 20.0016 15.8584C20.1396 15.8782 20.3225 15.8995 20.5502 15.9225C20.8056 15.9483 21 16.1633 21 16.42Z' onClick={() => {}} />
				</Dropdown>
			</div>
			{/* Colonne centrale : affichage du contenu sélectionné */}
			<div className='right-left-container flex flex-col items-start justify-start w-full min-w-[600px] h-full'>
				{selectedId && (
					<h3 className='title flex items-center gap-2  w-[250px] px-3 py-2 transition-colors select-none justify-between border-slate-800 border-r-2'>
						{[
							{ id: 'bio-1', title: 'about-me' },
							{ id: 'interests-1', title: 'video-games' },
							{ id: 'interests-2', title: 'coding' },
							{ id: 'studies-1', title: 'higher-education' },
							{ id: 'studies-2', title: 'high-school' },
						].find((item) => item.id === selectedId)?.title}
						<button onClick={() => setSelectedId(null)}>
							<Icon path='M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z' />
						</button>
					</h3>
				)}
				{selectedId && (
					<div className='flex flex-col text-justify text-xl text-slate-400 py-5 px-2 border-t-2 border-r-2 border-slate-800 h-full w-full '>
						<div className='flex flex-col font-mono text-[1.1rem] bg-none p-0 m-0 break-words gap-0'>
							<span className='flex items-start pl-2 indent-0 tabular-nums'>
								<span className='inline-block w-[2.2em] min-w-[2.2em] text-right text-slate-400 mr-[30px] select-none'>1</span>
								<span className='mr-2.5'>/**</span>
							</span>
							{itemContents[selectedId].map((line, idx) => (
								<span className='flex items-start pl-2 indent-0 tabular-nums' key={idx}>
									<span className='inline-block w-[2.2em] min-w-[2.2em] text-right text-slate-400 mr-[30px] select-none'>{String(idx + 2)}</span>
									<span className='mr-2.5'>*</span>
									<span className='flex-1 text-left break-words'>{line}</span>
								</span>
							))}
							<span className='flex items-start pl-2 indent-0 tabular-nums'>
								<span className='inline-block w-[2.2em] min-w-[2.2em] text-right text-slate-400 mr-[30px] select-none'>{itemContents[selectedId].length + 2}</span>
								<span className='mr-2.5'>*/</span>
							</span>
						</div>
					</div>
				)}
			</div>
			<span className='right-between-container flex items-start mt-[40px] pt-[10px] justify-center min-w-[40px] bg-transparent border-t-2 h-[calc(100%-40px)] border-slate-800 pt-5=3'>
				<div className='bg-slate-500 w-[26px] h-[6px]' />
			</span>
		</div>
	)
}
