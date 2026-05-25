import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE = 'nh_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 ngày

export type SessionPayload = {
  userId: string
  email: string
  role: 'customer' | 'merchant' | 'admin'
  exp: number
}

function getSecret() {
  const secret = process.env.SESSION_SECRET || process.env.CRON_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production')
  }
  return secret || 'dev-session-secret-change-me'
}

export function signSession(
  payload: Pick<SessionPayload, 'userId' | 'email' | 'role'>,
  maxAgeSec = SESSION_MAX_AGE,
): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec
  const body = JSON.stringify({ ...payload, exp })
  const b64 = Buffer.from(body).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(b64).digest('base64url')
  return `${b64}.${sig}`
}

export function verifySession(token: string): SessionPayload | null {
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const b64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', getSecret()).update(b64).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString()) as SessionPayload
    if (!payload.userId || !payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export function setSessionOnResponse(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
  return res
}

export function clearSessionOnResponse(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(0), maxAge: 0 })
  return res
}

export function getSessionFromRequest(request: NextRequest | Request): SessionPayload | null {
  if ('cookies' in request && typeof request.cookies?.get === 'function') {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    return token ? verifySession(token) : null
  }
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  if (!match?.[1]) return null
  return verifySession(decodeURIComponent(match[1]))
}
