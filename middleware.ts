import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

const WEBHOOK_PATHS = new Set([
  '/api/payments/sepay/webhook',
  '/api/payments/payos/webhook',
])

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

/** Webhook: rewrite apex → www nội bộ (tránh 307). */
function handlePaymentWebhook(request: NextRequest): NextResponse {
  const path = normalizePath(request.nextUrl.pathname)
  if (!WEBHOOK_PATHS.has(path)) {
    return NextResponse.next()
  }

  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase()
  if (host === 'netflixhub.com.vn') {
    const url = request.nextUrl.clone()
    url.hostname = 'www.netflixhub.com.vn'
    url.protocol = 'https:'
    url.pathname = path
    return NextResponse.rewrite(url)
  }

  if (request.nextUrl.pathname !== path) {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

/** Supabase OAuth đôi khi trả về Site URL (/) + ?code= — chuyển sang /auth/callback */
function redirectOAuthCodeToCallback(request: NextRequest): NextResponse | null {
  const path = normalizePath(request.nextUrl.pathname)
  if (path === '/auth/callback') return null

  const code = request.nextUrl.searchParams.get('code')
  const oauthError = request.nextUrl.searchParams.get('error')
  if (!code && !oauthError) return null

  const url = request.nextUrl.clone()
  url.pathname = '/auth/callback'
  return NextResponse.redirect(url)
}

/**
 * Middleware chạy trên Vercel Edge — không dùng Node crypto (verify session).
 * Bảo vệ trang: client (RequireAuth) + API routes (getSessionFromRequest).
 */
export async function middleware(request: NextRequest) {
  const path = normalizePath(request.nextUrl.pathname)

  if (WEBHOOK_PATHS.has(path)) {
    return handlePaymentWebhook(request)
  }

  const oauthRedirect = redirectOAuthCodeToCallback(request)
  if (oauthRedirect) {
    return oauthRedirect
  }

  try {
    return await updateSession(request)
  } catch (err) {
    console.error('[middleware] updateSession failed', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/api/payments/sepay/webhook',
    '/api/payments/payos/webhook',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
