import type { NextRequest } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth/session-cookie'

export function getAppSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}
