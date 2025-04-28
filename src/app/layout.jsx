import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import MainWrapper from '@/components/MainWrapper'
import { Analytics } from '@vercel/analytics/react'

// Définition des polices Google Fonts utilisées dans tout le site
const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata = {
	title: 'Portfolio - Noam Guez',
	description: 'Mon portfolio de développeur web',
	icons: [
		{
			rel: 'icon', // ← important
			url: '/assets/noam.webp',
			type: 'image/x-icon',
		},
	],
}

export default function RootLayout({ children }) {
	// Layout racine de l'application, englobe tout le site
	return (
		<html lang='fr'>
			<head>
				{/* Préconnexion et import des polices Google Fonts */}
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link
					rel='preconnect'
					href='https://fonts.gstatic.com'
					crossOrigin=''
				/>
				<link
					href='https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap'
					rel='stylesheet'
				/>
			</head>
			<body
				// Application des polices et du fond global
				className={`${geistSans.variable} ${geistMono.variable} h-full bg-slate-700 antialiased`}
			>
				{/* MainWrapper englobe tout le contenu de la page (header, footer, etc.) */}
				<MainWrapper>{children}</MainWrapper>
				<Analytics />
			</body>
		</html>
	)
}
