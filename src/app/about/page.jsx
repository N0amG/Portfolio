import GithubActivityServer from '@/components/GithubActivityServer'
import AboutClient from './AboutClient'

export default function About() {
	return (
		<div
			id='about-me'
			className='flex flex-col w-full h-full lg:h-screen overflow-hidden'
		>
			<div className='flex flex-col md:flex-row flex-1 w-full overflow-hidden'>
				<AboutClient className=""/>
				<div className='right-right-container flex w-full lg:w-2/3 h-full flex-col mt-[40px] border-l-2 border-t-2 border-slate-800 lg:overflow-hidden'>
					<div className='flex flex-col lg:px-4 pt-3 pb-5 lg:overflow-y-auto scrollbar-custom h-full lg:max-h-[calc(100%-56px)] w-full'>
						<h2 className='pl-2 pb-1 text-xl font-bold text-slate-200 underline'>Activité GitHub récente</h2>
						<GithubActivityServer className='w-full'/>
					</div>
				</div>
			</div>
		</div>
	)
}
