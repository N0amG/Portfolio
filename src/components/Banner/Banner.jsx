import NameTitle from '@/components/NameTitle/NameTitle'

export default function Banner() {
	return (
		<div className='flex flex-col items-center justify-center h-screen bg-background text-foreground'>
			<div className='relative'>
				<NameTitle />
			</div>
		</div>
	)
}
