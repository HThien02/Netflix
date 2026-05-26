import { NextResponse } from 'next/server'
import {
  getSessionFromRequest,
  type SessionPayload,
} from '@/lib/auth/session-cookie'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

export function jsonUnauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function jsonForbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function requireSession(
  request: Request,
): SessionPayload | NextResponse {
  const session = getSessionFromRequest(request)
  if (!session) return jsonUnauthorized()
  return session
}

export function isSessionResponse(
  value: SessionPayload | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse
}

export function assertUserId(
  session: SessionPayload,
  userId: string | undefined | null,
): NextResponse | null {
  if (!userId || userId !== session.userId) {
    return jsonForbidden('User mismatch')
  }
  return null
}

const DEMO_ADMIN_IDS = new Set(['admin-1', '550e8400-e29b-41d4-a716-446655440006'])

/** Admin: bắt buộc session role admin (production). Dev có thể fallback adminUserId. */
export async function requireAdminSession(
  request: Request,
  legacyAdminUserId?: string | null,
): Promise<SessionPayload | NextResponse> {
  const session = getSessionFromRequest(request)
  if (session?.role === 'admin') return session

  if (process.env.NODE_ENV === 'production') {
    return jsonForbidden('Admin access required')
  }

  if (!legacyAdminUserId) return jsonUnauthorized()

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', legacyAdminUserId)
      .single()
    if (!data || data.role !== 'admin') return jsonForbidden()
    return {
      userId: data.id,
      email: String(data.email || ''),
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
  }

  if (!DEMO_ADMIN_IDS.has(legacyAdminUserId)) return jsonForbidden()
  return {
    userId: legacyAdminUserId,
    email: 'admin@example.com',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
}

export function verifyCronSecret(request: Request): boolean {
  const secret = request.headers.get('x-cron-secret') || ''
  return Boolean(process.env.CRON_SECRET && secret === process.env.CRON_SECRET)
}
