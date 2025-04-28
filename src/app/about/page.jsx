import GithubActivityServer from '@/components/GithubActivityServer'
import AboutClient from './AboutClient'

export default function About() {
	return (
		<div
			id='about-me'
			className='flex flex-col w-full h-screen overflow-hidden'
		>
			<div className='flex flex-1 w-full overflow-hidden'>
				<AboutClient className=""/>
				<div className='right-right-container flex w-2/3 h-full flex-col mt-[40px] border-l-2 border-t-2 border-slate-800 overflow-hidden'>
					<div className='flex flex-col px-4 pt-3 overflow-y-auto scrollbar-custom max-h-[calc(100%-56px)] w-full'>
						<h2 className='pl-2 pb-1 text-xl font-bold text-slate-200 underline'>Activité GitHub récente</h2>
						<GithubActivityServer className=''/>
					</div>
				</div>
			</div>
		</div>
	)
}
