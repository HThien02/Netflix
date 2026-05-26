import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

const WEBHOOK_PATHS = new Set([
  '/api/payments/sepay/webhook',
  '/api/payments/payos/webhook',
])

function normalizeWebhookPath(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/'
  return p
}

/** Webhook: rewrite apex → www nội bộ (tránh 307). Không chạy Supabase session. */
function handlePaymentWebhook(request: NextRequest): NextResponse {
  const path = normalizeWebhookPath(request.nextUrl.pathname)
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

export async function middleware(request: NextRequest) {
  const path = normalizeWebhookPath(request.nextUrl.pathname)
  if (WEBHOOK_PATHS.has(path)) {
    return handlePaymentWebhook(request)
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/api/payments/sepay/webhook',
    '/api/payments/payos/webhook',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
