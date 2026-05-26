import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

export type AdminDashboardStats = {
  customers: number
  activeRentals: number
  revenueThisMonth: number
  revenueTotal: number
  openTickets: number
  sepayPending: number
  productsActive: number
  poolSlotsFree: number
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  recentOrders: Array<{
    id: string
    invoiceNumber: string | null
    amount: number
    status: string
    paymentMethod: string
    createdAt: string
    userEmail: string | null
    userName: string | null
  }>
  recentTickets: Array<{
    id: string
    subject: string
    status: string
    priority: string
    createdAt: string
    userEmail: string | null
    userName: string | null
  }>
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const empty: AdminDashboardStats = {
    customers: 0,
    activeRentals: 0,
    revenueThisMonth: 0,
    revenueTotal: 0,
    openTickets: 0,
    sepayPending: 0,
    productsActive: 0,
    poolSlotsFree: 0,
    monthlyRevenue: [],
    recentOrders: [],
    recentTickets: [],
  }

  if (!isSupabaseConfigured()) return empty

  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  const [
    usersRes,
    rentalsRes,
    ticketsOpenRes,
    productsRes,
    poolRes,
    sepayPendingRes,
    invoicesRes,
    recentInvoicesRes,
    recentTicketsRes,
  ] = await Promise.all([
    supabase.from('users').select('id, role'),
    supabase
      .from('purchased_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gt('expires_at', now.toISOString()),
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase.from('streaming_account_pool').select('max_slots, slots_used, status').eq('status', 'active'),
    supabase
      .from('sepay_pending_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('invoices')
      .select('final_amount, status, created_at')
      .gte('created_at', sixMonthsAgo),
    supabase
      .from('invoices')
      .select(
        'id, invoice_number, final_amount, status, payment_method, created_at, users(email, full_name)',
      )
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('support_tickets')
      .select('id, subject, status, priority, created_at, users(email, full_name)')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const customers = (usersRes.data || []).filter((u) => u.role === 'customer').length
  const activeRentals = rentalsRes.count ?? 0
  const openTickets = ticketsOpenRes.count ?? 0
  const productsActive = productsRes.count ?? 0
  const sepayPending = sepayPendingRes.count ?? 0

  let poolSlotsFree = 0
  for (const row of poolRes.data || []) {
    poolSlotsFree += Math.max(0, Number(row.max_slots) - Number(row.slots_used))
  }

  const completedStatuses = new Set(['completed', 'paid'])
  let revenueThisMonth = 0
  let revenueTotal = 0
  const byMonth = new Map<string, { revenue: number; orders: number }>()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    byMonth.set(monthKey(d), { revenue: 0, orders: 0 })
  }

  for (const inv of invoicesRes.data || []) {
    const amount = Number(inv.final_amount) || 0
    const created = new Date(String(inv.created_at))
    const key = monthKey(created)
    if (!completedStatuses.has(String(inv.status))) continue

    revenueTotal += amount
    if (created >= startOfMonth(now)) {
      revenueThisMonth += amount
    }
    const bucket = byMonth.get(key)
    if (bucket) {
      bucket.revenue += amount
      bucket.orders += 1
    }
  }

  const monthlyRevenue = Array.from(byMonth.entries()).map(([month, v]) => ({
    month,
    revenue: v.revenue,
    orders: v.orders,
  }))

  type UserJoin = { email?: string; full_name?: string } | { email?: string; full_name?: string }[] | null

  const recentOrders = (recentInvoicesRes.data || []).map((row) => {
    const u = row.users as UserJoin
    const user = Array.isArray(u) ? u[0] : u
    return {
      id: String(row.id),
      invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
      amount: Number(row.final_amount) || 0,
      status: String(row.status),
      paymentMethod: String(row.payment_method || ''),
      createdAt: String(row.created_at),
      userEmail: user?.email ? String(user.email) : null,
      userName: user?.full_name ? String(user.full_name) : null,
    }
  })

  const recentTickets = (recentTicketsRes.data || []).map((row) => {
    const u = row.users as UserJoin
    const user = Array.isArray(u) ? u[0] : u
    return {
      id: String(row.id),
      subject: String(row.subject),
      status: String(row.status),
      priority: String(row.priority),
      createdAt: String(row.created_at),
      userEmail: user?.email ? String(user.email) : null,
      userName: user?.full_name ? String(user.full_name) : null,
    }
  })

  return {
    customers,
    activeRentals,
    revenueThisMonth,
    revenueTotal,
    openTickets,
    sepayPending,
    productsActive,
    poolSlotsFree,
    monthlyRevenue,
    recentOrders,
    recentTickets,
  }
}
