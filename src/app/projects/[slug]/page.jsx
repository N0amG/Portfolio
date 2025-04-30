import Link from 'next/link'
import { notFound } from 'next/navigation'
import projects from '@/app/projects/projects'
import Carousel from '@/components/Carousel'
import Icon from '@/components/Icon'

export default async function ProjectDetail({ params }) {
	const { slug } = await params

	const toSlug = (str) => str.toLowerCase().replace(/\s+/g, '-')
	const project = projects.find((p) => toSlug(p.title) === slug)

	if (!project) return notFound()

	const images = Array.from(
		{ length: project.imgCount },
		(_, index) => `/img/${slug}/${index}.webp`
	)
	return (
		<div className='project-slug flex flex-col h-full max-h-[calc(100%-93px)] w-full px-4 pt-6'>
			<div className='flex mb-4'>
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
						<path d='M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z'></path>
					</svg>
				</Link>
			</div>
			<div className='container flex md:self-center flex-col lg:flex-row h-full lg:ml-20 lg:max-w-[calc(100%-80px)] lg:max-h-[calc(100%-60px)] w-full'>
				<Carousel className='min-w-0 w-full h-[30%]  lg:h-[calc(100%-40px)] mb-6 lg:mb-10 lg:mr-10'>
					{images.map((src, index) => (
						<img
							key={index}
							src={src}
							className='w-full h-full object-cover rounded-xl'
							alt={`Image ${index}`}
						/>
					))}
				</Carousel>
				<div
					id='desciption'
					className='flex flex-col w-full lg:w-[calc(100%-120px)] pb-3 items-start overflow-y-auto scrollbar-custom pr-0 lg:pr-3'
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
					<ul className='flex flex-col text-slate-300 text-md my-4 list-inside h-fit'>
						{project.description.map((desc, idx) => (
							<li key={idx} className='flex flex-wrap'>
								{desc === '' ? <br /> : desc}
							</li>
						))}
					</ul>
					<Link
						href={project.url}
						target='_blank'
						rel='noopener noreferrer'
						className='flex font-semibold text-indigo-400 mr-2 hover:underline'
					>
						<button className='flex items-center gap-2 px-3 py-2 mt-3 mb-1 rounded-lg bg-slate-600 text-slate-50 text-sm font-mono hover:bg-slate-500 transition'>
							Voir le projet{' '}
							<Icon
								path='M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z'
								size={30}
								className='text-slate-400'
							/>
						</button>
					</Link>
				</div>
			</div>
		</div>
	)
}
