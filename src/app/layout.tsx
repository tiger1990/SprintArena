import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SprintArena — AI-Powered Sprint Planning',
  description: 'Transform messy feature ideas into structured Agile sprints with AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#0e0e10', color: '#f9f5f8' }}
      >
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}
