import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Noam Guez | Développeur Web",
  description:
    "Portfolio de Noam Guez – Développeur Web passionné par la création d'applications web modernes avec React, Next.js, Python et Django.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='winter'||t==='night'){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','night')}}catch(e){document.documentElement.setAttribute('data-theme','night')}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="night" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-[var(--font-display)] antialiased bg-base-100 text-base-content`}>
        <ThemeProvider>
          <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
