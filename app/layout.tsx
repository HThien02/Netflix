import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { OAuthCodeRedirect } from '@/components/auth/oauth-code-redirect'
import { AppProvider } from '@/lib/context'
import { DEFAULT_SITE_URL, SITE_DOMAIN, SITE_NAME } from '@/lib/site'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(DEFAULT_SITE_URL),
  title: `${SITE_NAME} - Chợ gói streaming cao cấp`,
  description:
    'Mua và quản lý gói Netflix, streaming — thanh toán PayOS, giao tài khoản tự động.',
  keywords: ['streaming', 'subscription', 'Netflix', 'PayOS', SITE_DOMAIN],
  authors: [{ name: SITE_NAME, url: DEFAULT_SITE_URL }],
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_DOMAIN}`,
    description: 'Chợ gói streaming — thanh toán nhanh, giao account tự động',
    url: DEFAULT_SITE_URL,
    siteName: SITE_NAME,
    locale: 'vi_VN',
    type: 'website',
  },
  alternates: {
    canonical: DEFAULT_SITE_URL,
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
          <Suspense fallback={null}>
            <OAuthCodeRedirect />
          </Suspense>
          {children}
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
