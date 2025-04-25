import GithubActivityServer from '@/components/GithubActivityServer'
import AboutClient from './AboutClient'

export default function About() {
	return (
		<div
			id='about-me'
			className='flex flex-1 items-start justify-start w-full'
		>
			<AboutClient />
			<div className='right-right-container flex items-start justify-start w-full h-[calc(100%-40px)] mt-[40px] border-l-2 border-t-2 border-slate-800'>
				<div className='flex w-full h-[460px] overflow-y-auto px-4'>
					<GithubActivityServer className='w-full h-full' />
				</div>
			</div>
		</div>
	)
}
