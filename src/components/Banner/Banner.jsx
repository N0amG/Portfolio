import NameTitle from '@/components/NameTitle/NameTitle'
import FluidSimulation from '@/components/FluidSimulation/FluidSimulation'

export default function Banner() {
	return (
		<div className='relative h-[3000px]'>
			<div className='absolute top-0 left-0 w-full h-screen z-0'>
				<FluidSimulation />
			</div>
			<div className='absolute top-0 left-0 w-full h-screen flex justify-center items-center z-10 select-none pointer-events-none'>
				<div className='relative'>
					<NameTitle />
				</div>
			</div>
		</div>
	)
}
