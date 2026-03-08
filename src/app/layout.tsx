import type { Metadata } from 'next'
import { Bebas_Neue, Manrope, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { Analytics } from '@vercel/analytics/next'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const displayFont = Bebas_Neue({
  weight: ['400'],
  variable: '--font-display',
  subsets: ['latin'],
})

const bodyFont = Manrope({
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Workout Timer',
  description: 'Build interval workouts and run a guided timer experience.',
  manifest: '/manifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-180.png', sizes: '180x180' }],
  },
}

export const viewport = {
  themeColor: '#0c0f12',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
