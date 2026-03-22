import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Noam Guez",
  description: "Portfolio de Noam Guez – Développeur Web.",
  icons: {
    icon: "/img/avatar.webp",
    apple: "/img/avatar.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="night" suppressHydrationWarning>
      <body className={`${inter.variable} font-[var(--font-display)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
