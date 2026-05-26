import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { getAdminDashboardStats } from '@/lib/admin/dashboard-stats'

export async function GET(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminId, request)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const stats = await getAdminDashboardStats()
  return NextResponse.json({ stats })
}
