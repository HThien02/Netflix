import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { listAllSupportTickets } from '@/lib/support/tickets-server'
import type { SupportTicket } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminId, request)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') as SupportTicket['status'] | 'all' | null

  const tickets = await listAllSupportTickets({
    status: status && status !== 'all' ? status : 'all',
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  }

  return NextResponse.json({ tickets, stats })
}
