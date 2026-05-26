import { NextResponse } from 'next/server'
import {
  checkApiRateLimit,
  rateLimitHeaders,
} from '@/lib/security/rate-limit'
import { isAllowedApiOrigin } from '@/lib/security/origin'
import {
  assertUserId,
  isSessionResponse,
  requireAdminSession,
  requireSession,
  verifyCronSecret,
} from '@/lib/security/api-auth'

export type GuardOptions = {
  auth?: 'none' | 'session' | 'admin' | 'cron'
  /** userId trong body/query phải khớp session */
  matchUserId?: string | null
  legacyAdminUserId?: string | null
  skipOriginCheck?: boolean
  skipRateLimit?: boolean
}

export async function guardApiRequest(
  request: Request,
  options: GuardOptions = {},
): Promise<NextResponse | null> {
  if (!options.skipRateLimit) {
    const rl = checkApiRateLimit(request)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: rateLimitHeaders(rl),
        },
      )
    }
  }

  if (!options.skipOriginCheck && !isAllowedApiOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const auth = options.auth ?? 'none'

  if (auth === 'cron') {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return null
  }

  if (auth === 'session') {
    const session = requireSession(request)
    if (isSessionResponse(session)) return session
    if (options.matchUserId) {
      const mismatch = assertUserId(session, options.matchUserId)
      if (mismatch) return mismatch
    }
    return null
  }

  if (auth === 'admin') {
    const admin = await requireAdminSession(request, options.legacyAdminUserId)
    if (admin instanceof NextResponse) return admin
    return null
  }

  return null
}

export function getSessionOrNull(request: Request) {
  const session = requireSession(request)
  if (isSessionResponse(session)) return null
  return session
}
