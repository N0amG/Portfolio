import Avatar from '@/components/Avatar'

export default function Home() {
	return (
		<div
			className='flex flex-col items-start h-full justify-center bg-transparent text-foreground b z-1 select-none'
			id='home'
		>
			<div className='flex items-center justify-center h-1/2 bg-transparent text-foreground z-1 gap-[60px]'>
				<div>
					<span className='flex w-full text-left px-4 text-slate-400'>
						Hi all. I am
					</span>
					<h1 className='text-left w-full text-8xl text-slate-50 px-4 rounded-xl z-0'>
						Noam Guez
					</h1>
					<h2 className='text-left w-full text-4xl text-indigo-500 p-4 rounded-xl z-0'>
						{'> Full-Stack Developer'}
					</h2>
				</div>
				<Avatar />
			</div>
			<div className='flex flex-col p-4'>
				<p className='text-slate-400'>//find my profile on Github:</p>
				<p>
					<span className='text-indigo-500'>const </span>
					<span className='text-teal-400'>githubLink</span> ={' '}
					<a
						href='https://github.com/N0amG'
						className='text-rose-300'
						target='_blank'
					>
						https://github.com/N0amG
					</a>
				</p>
			</div>
		</div>
	)
}
