import { shouldForwardOAuthQueryToCallback } from '@/lib/auth/oauth-query'
import { updateSession } from '@/lib/supabase/proxy'
import { applySecurityHeaders } from '@/lib/security/headers'
import { isAllowedApiOrigin } from '@/lib/security/origin'
import {
  checkApiRateLimit,
  rateLimitHeaders,
} from '@/lib/security/rate-limit'
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

/** Chỉ chuyển mã OAuth UUID — không nhầm ?code=NH... (SePay checkout) */
function redirectOAuthCodeToCallback(request: NextRequest): NextResponse | null {
  if (!shouldForwardOAuthQueryToCallback(request.nextUrl.pathname, request.nextUrl.searchParams)) {
    return null
  }

  const url = request.nextUrl.clone()
  url.pathname = '/auth/callback'
  return NextResponse.redirect(url)
}

function guardApiMiddleware(request: NextRequest): NextResponse | null {
  const path = normalizePath(request.nextUrl.pathname)
  if (!path.startsWith('/api')) return null
  if (WEBHOOK_PATHS.has(path)) return null
  if (path.startsWith('/api/cron/')) return null

  if (!isAllowedApiOrigin(request)) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Invalid origin' }, { status: 403 }),
    )
  }

  const rl = checkApiRateLimit(request)
  if (!rl.ok) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitHeaders(rl) },
      ),
    )
  }

  return null
}

export async function middleware(request: NextRequest) {
  const path = normalizePath(request.nextUrl.pathname)

  if (WEBHOOK_PATHS.has(path)) {
    return applySecurityHeaders(handlePaymentWebhook(request))
  }

  const apiBlocked = guardApiMiddleware(request)
  if (apiBlocked) return apiBlocked

  const oauthRedirect = redirectOAuthCodeToCallback(request)
  if (oauthRedirect) {
    return applySecurityHeaders(oauthRedirect)
  }

  try {
    return applySecurityHeaders(await updateSession(request))
  } catch (err) {
    console.error('[middleware] updateSession failed', err)
    return applySecurityHeaders(NextResponse.next())
  }
}

export const config = {
  matcher: [
    '/api/payments/sepay/webhook',
    '/api/payments/payos/webhook',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
