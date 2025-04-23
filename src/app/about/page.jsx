'use client'

import Dropdown from '@/components/Dropdown'
import DropdownItem from '@/components/DropdownItem'
import { useState } from 'react'

export default function About() {
	const [selectedId, setSelectedId] = useState(null)
	return (
		<>
			<div className='flex flex-col justify-start w-[250px]'>
				<Dropdown
					title='bio'
					iconColor='rose-400' // Couleur de l'icône dossier
				>
					<DropdownItem
						id='bio-1'
						title='about me'
						iconPath='M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z'
						activeId={selectedId}
						onClick={setSelectedId}
					/>
				</Dropdown>

				<Dropdown
					title='interests'
					iconColor='teal-400' // Couleur de l'icône dossier
				>
					<DropdownItem
						id='interests-1'
						title='video games'
						iconPath='M24 12L18.3431 17.6569L16.9289 16.2426L21.1716 12L16.9289 7.75736L18.3431 6.34315L24 12ZM2.82843 12L7.07107 16.2426L5.65685 17.6569L0 12L5.65685 6.34315L7.07107 7.75736L2.82843 12ZM9.78845 21H7.66009L14.2116 3H16.3399L9.78845 21Z'
						activeId={selectedId}
						onClick={setSelectedId}
					/>
					<DropdownItem
						id='interests-2'
						title='coding'
						iconPath='M17 4C20.3137 4 23 6.68629 23 10V14C23 17.3137 20.3137 20 17 20H7C3.68629 20 1 17.3137 1 14V10C1 6.68629 3.68629 4 7 4H17ZM17 6H7C4.8578 6 3.10892 7.68397 3.0049 9.80036L3 10V14C3 16.1422 4.68397 17.8911 6.80036 17.9951L7 18H17C19.1422 18 20.8911 16.316 20.9951 14.1996L21 14V10C21 7.8578 19.316 6.10892 17.1996 6.0049L17 6ZM10 9V11H12V13H9.999L10 15H8L7.999 13H6V11H8V9H10ZM18 13V15H16V13H18ZM16 9V11H14V9H16Z'
						activeId={selectedId}
						onClick={setSelectedId}
					/>
				</Dropdown>
				<Dropdown
					title='studies'
					iconColor='indigo-500' // Couleur de l'icône dossier
				>
					<DropdownItem
						id='etudes-1'
						title='higher education'
						iconPath='M4 16H20V5H4V16ZM13 18V20H17V22H7V20H11V18H2.9918C2.44405 18 2 17.5511 2 16.9925V4.00748C2 3.45107 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44892 22 4.00748V16.9925C22 17.5489 21.5447 18 21.0082 18H13Z'
						activeId={selectedId}
						onClick={setSelectedId}
					/>
					<DropdownItem
						id='etudes-2'
						title='high school'
						iconPath='M12 0.585693L18 6.58569V9H22V19H23V21H1V19H2V9H6V6.58569L12 0.585693ZM18 19H20V11H18V19ZM6 11H4V19H6V11ZM8 7.41412V18.9999H11V12H13V18.9999H16V7.41412L12 3.41412L8 7.41412Z'
						activeId={selectedId}
						onClick={setSelectedId}
					/>
				</Dropdown>
			</div>
		</>
	)
}
