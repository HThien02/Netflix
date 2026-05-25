import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '@/lib/context'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'NetflixHub - Premium Subscription SaaS',
  description: 'The ultimate streaming subscription marketplace. Manage subscriptions, purchase plans, and enjoy premium content.',
  generator: 'v0.app',
  keywords: ['streaming', 'subscription', 'SaaS', 'premium', 'content'],
  authors: [{ name: 'NetflixHub' }],
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'NetflixHub - Premium Subscription SaaS',
    description: 'The ultimate streaming subscription marketplace',
    siteName: 'NetflixHub',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#E50914',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <AppProvider>
          {children}
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
