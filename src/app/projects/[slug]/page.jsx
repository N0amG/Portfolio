// Page dynamique pour chaque projet
import Link from 'next/link'
import { notFound } from 'next/navigation'
import projects from '@/app/projects/projects'
import Carousel from '@/components/Carousel'

export default async function ProjectDetail({ params }) {
	const { slug } = await params
	const toSlug = (str) => str.toLowerCase().replace(/\s+/g, '-')
	const project = projects.find((p) => toSlug(p.title) === slug)

	if (!project) return notFound()

	return (
		<div className='project-slug flex flex-col h-full max-h-[calc(100%-93px)] w-full px-4 pt-6'>
			<div className='flex  mb-4'>
				
				<h2 className='flex w-full h-fit text-4xl text-center justify-center font-bold text-indigo-400'>
					<Link
						href={project.url}
						target='_blank'
						rel='noopener noreferrer'
						className='flex font-semibold text-indigo-400 mr-2 hover:underline'
					>
						{project.title}
					</Link>
				</h2>
				<Link href='/projects/' className='self-end'>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						viewBox='0 0 24 24'
						fill='currentColor'
						width={50}
						className='rounded-full p-2 bg-slate-500 border-2 border-slate-800 hover:bg-indigo-500 hover:scale-[1.1] transition-transform duration-200'
					>
						<path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
					</svg>
				</Link>
			</div>
			<div className='container flex h-full ml-20 max-w-[calc(100%-80px)] max-h-[calc(100%-60px)]'>
				<Carousel className=' min-w-[400px] w-full h-[calc(100%-40px)] mb-10 mr-10 '>
					<img
						src={project.img}
						alt={project.title}
						className='w-full h-full object-cover rounded-xl'
					/>
					<img
						src={project.img}
						alt={project.title}
						className='w-full h-full object-cover rounded-xl'
					/>
					<img
						src={project.img}
						alt={project.title}
						className='w-full h-full object-cover rounded-xl'
					/>
					<img
						src={project.img}
						alt={project.title}
						className='w-full h-full object-cover rounded-xl'
					/>
					<img
						src={project.img}
						alt={project.title}
						className='w-full h-full object-cover rounded-xl'
					/>
				</Carousel>
				<div
					id='desciption'
					className='flex flex-col w-[calc(100%-120px)] items-start overflow-y-auto scrollbar-custom pr-3'
				>
					<div className='flex flex-wrap gap-2 mb-4'>
						{project.languages.map((tag) => (
							<span
								key={tag}
								className='bg-slate-800 text-slate-200 px-3 py-1 rounded-full text-sm'
							>
								{tag}
							</span>
						))}
					</div>
					<ul className='flex flex-col text-slate-300 text-md my-4 list-inside h-full'>
						{project.description.map((desc, idx) => (
							<li key={idx} className='flex flex-wrap'>
								{desc === '' ? <br /> : desc}
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}
