import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'

const DEMO_ADMIN_IDS = new Set(['admin-1', '550e8400-e29b-41d4-a716-446655440006'])

export async function requireAdminUser(
  adminUserId: string | undefined | null,
  request?: Request,
) {
  if (request) {
    const session = getSessionFromRequest(request)
    if (session?.role === 'admin') {
      return { id: session.userId, role: 'admin' as const }
    }
  }

  if (!adminUserId) {
    throw new Error('Unauthorized')
  }

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', adminUserId)
      .single()

    if (error || !data || data.role !== 'admin') {
      throw new Error('Forbidden')
    }
    return data
  }

  if (!DEMO_ADMIN_IDS.has(adminUserId)) {
    throw new Error('Forbidden')
  }
  return { id: adminUserId, role: 'admin' as const }
}
