import Banner from '@/components/Banner'
import TextCard from '@/components/TextCard'

export default function Home() {
	return (
		<main className='flex min-h-screen h-[3000px] flex-col items-center'>
			<Banner />

			<section
				id='about'
				className='flex flex-col justify-center w-full bg-background text-foreground pt-30'
			>
				<h2 className='text-primary font-bold text-2xl m-5'>À propos de moi</h2>
				<TextCard>
					Salut, moi c’est Noam 👋 <br />
          Développeur web passionné par l’I.A, le développement applicatif et les projets techniques innovants. <br />
          Diplomé d'un bac +2 en developpemenbt web,
          je construis des projets robustes en front comme en back.
				</TextCard>
			</section>
		</main>
	)
}
