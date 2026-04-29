import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Noam Guez | Développeur Web",
  description:
    "Portfolio de Noam Guez – Développeur Web passionné par la création d'applications web modernes avec React, Next.js, Python et Django.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='winter'||t==='night'){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','night')}}catch(e){document.documentElement.setAttribute('data-theme','night')}})()`;

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <ThemeProvider>
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-base-100 text-base-content">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </ThemeProvider>
      <SpeedInsights />
    </>
  );
}
