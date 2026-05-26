type Bucket = 'auth' | 'payment' | 'api' | 'webhook'

type Entry = { count: number; resetAt: number }

const BUCKET_LIMITS: Record<Bucket, { windowMs: number; max: number }> = {
  auth: { windowMs: 60_000, max: 15 },
  payment: { windowMs: 60_000, max: 40 },
  api: { windowMs: 60_000, max: 120 },
  webhook: { windowMs: 60_000, max: 500 },
}

/** In-memory sliding window — best-effort trên serverless (mỗi instance riêng). */
const store = new Map<string, Entry>()

function prune() {
  const now = Date.now()
  if (store.size < 5000) return
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export function classifyApiBucket(pathname: string): Bucket {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path.includes('/webhook')) return 'webhook'
  if (
    path.startsWith('/api/auth/') ||
    path === '/api/auth/login' ||
    path === '/api/auth/register' ||
    path === '/api/auth/forgot-password' ||
    path === '/api/auth/reset-password'
  ) {
    return 'auth'
  }
  if (path.startsWith('/api/payments/')) return 'payment'
  return 'api'
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number; resetAt: number }

export function checkRateLimit(
  key: string,
  bucket: Bucket = 'api',
): RateLimitResult {
  prune()
  const { windowMs, max } = BUCKET_LIMITS[bucket]
  const now = Date.now()
  const storeKey = `${bucket}:${key}`
  let entry = store.get(storeKey)

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(storeKey, entry)
  }

  entry.count += 1

  if (entry.count > max) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    return { ok: false, retryAfterSec, resetAt: entry.resetAt }
  }

  return { ok: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (result.ok) {
    return {
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    }
  }
  return {
    'Retry-After': String(result.retryAfterSec),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  }
}

export function checkApiRateLimit(request: Request): RateLimitResult {
  const url = new URL(request.url)
  const bucket = classifyApiBucket(url.pathname)
  const ip = getClientIp(request)
  return checkRateLimit(ip, bucket)
}
