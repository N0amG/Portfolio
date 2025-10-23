import GithubActivity from '@/components/GithubActivity'
import AboutClient from './AboutClient'

export default function About() {
	return (
		<div
			id='about-me'
			className='flex flex-col w-full h-full lg:h-screen overflow-hidden'
		>
			<div className='flex flex-col md:flex-row flex-1 w-full overflow-hidden'>
				<AboutClient className=""/>
				<div className='right-right-container flex w-full lg:w-2/3 h-full flex-col mt-[38px] border-l-2 border-t-2 border-slate-800 lg:overflow-hidden'>
					<div className='flex flex-col px-2 lg:px-4 pt-3 pb-5 lg:overflow-y-auto scrollbar-custom h-full lg:max-h-[calc(100%-56px)] w-full md:min-w-[190px] lg:min-w-[300px]'>
						<h2 className='pl-2 pb-1 text-xl font-bold text-slate-200 underline'>Activité GitHub récente</h2>
						<GithubActivity className=''/>
					</div>
				</div>
			</div>
		</div>
	)
}
