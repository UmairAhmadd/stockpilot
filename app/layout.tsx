import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StockPilot — Inventory & Sales',
  description: 'Inventory and sales management for electronics retailers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${grotesk.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
