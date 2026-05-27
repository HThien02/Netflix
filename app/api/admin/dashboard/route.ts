import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { getAdminDashboardStats } from '@/lib/admin/dashboard-stats'
import { createAdminClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { isSepayApiConfigured } from '@/lib/sepay/api-client'
import { tryCompleteSepayFromApi } from '@/lib/sepay/sync-from-api'

const MAX_SEPAY_SYNC_ON_DASHBOARD = 5

async function syncRecentPendingSepayOrders() {
  if (!isSepayApiConfigured() || !hasSupabaseServiceRole()) return
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sepay_pending_orders')
    .select('payment_code')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(MAX_SEPAY_SYNC_ON_DASHBOARD)

  await Promise.allSettled(
    (data || []).map((row) => tryCompleteSepayFromApi(String(row.payment_code))),
  )
}

export async function GET(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminId, request)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await syncRecentPendingSepayOrders()
  const stats = await getAdminDashboardStats()
  return NextResponse.json({ stats })
}
