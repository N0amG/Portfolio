import GithubActivityServer from '@/components/GithubActivityServer'
import AboutClient from './AboutClient'

export default function About() {
	return (
		<div
			id='about-me'
			className='flex flex-col w-full h-screen overflow-hidden'
		>
			<div className='flex flex-1 w-full overflow-hidden'>
				<AboutClient />
				<div className='right-right-container flex w-full h-full flex-col mt-[40px] border-l-2 border-t-2 border-slate-800 overflow-hidden'>
					<div className='flex-1 px-4 overflow-y-auto scrollbar-custom max-h-[calc(100%-56px)]'>
						<GithubActivityServer className='w-full' />
					</div>
				</div>
			</div>
		</div>
	)
}
