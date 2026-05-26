import { isSupabaseConfigured } from '@/lib/auth/login'
import {
  getUserInvoices,
  getUserPurchasedAccounts,
  getUserSubscriptions,
} from '@/lib/supabase/queries'
import {
  loadInvoicesLocal,
  loadPurchasedAccountsLocal,
} from '@/lib/orders/complete-purchase'
import type { Invoice, PurchasedAccount, Subscription } from '@/lib/types'

export async function loadUserData(userId: string) {
  let subscriptions: Subscription[] = []
  let invoices: Invoice[] = []
  let purchasedAccounts: PurchasedAccount[] = []

  if (isSupabaseConfigured()) {
    const [subs, invs, accounts] = await Promise.all([
      getUserSubscriptions(userId),
      getUserInvoices(userId),
      getUserPurchasedAccounts(userId),
    ])
    subscriptions = mapSubscriptions(subs)
    invoices = mapInvoices(invs)
    purchasedAccounts = mapPurchasedAccounts(accounts)
  }

  const localInvoices = loadInvoicesLocal(userId)
  const localAccounts = loadPurchasedAccountsLocal(userId)

  invoices = mergeById(invoices, localInvoices)
  purchasedAccounts = mergeById(purchasedAccounts, localAccounts)

  return { subscriptions, invoices, purchasedAccounts }
}

function mergeById<T extends { id: string }>(primary: T[], extra: T[]): T[] {
  const ids = new Set(primary.map((x) => x.id))
  return [...primary, ...extra.filter((x) => !ids.has(x.id))]
}

function mapSubscriptions(rows: Record<string, unknown>[]): Subscription[] {
  return rows.map((s) => ({
    id: String(s.id),
    userId: String(s.user_id),
    productId: String(s.product_id),
    planType: (s.plan_type as Subscription['planType']) || 'monthly',
    status: (s.status as Subscription['status']) || 'active',
    startDate: new Date(String(s.start_date)),
    renewalDate: new Date(String(s.end_date || s.start_date)),
    autoRenew: Boolean(s.auto_renew),
    price: Number(s.price) || 0,
    nextBillingDate: new Date(String(s.end_date || s.start_date)),
    createdAt: new Date(String(s.created_at)),
    updatedAt: new Date(String(s.updated_at)),
    productName:
      (s.products as { name?: string } | null)?.name ?? undefined,
  }))
}

function mapInvoices(rows: Record<string, unknown>[]): Invoice[] {
  return rows.map((inv) => ({
    id: String(inv.id),
    userId: String(inv.user_id),
    subscriptionId: String(inv.subscription_id || ''),
    amount: Number(inv.total_amount) || 0,
    taxAmount: Number(inv.tax_amount) || 0,
    totalAmount: Number(inv.final_amount) || 0,
    status:
      inv.status === 'completed'
        ? 'paid'
        : (inv.status as Invoice['status']) || 'pending',
    paymentMethod: (inv.payment_method as Invoice['paymentMethod']) || 'payos',
    invoiceDate: new Date(String(inv.created_at)),
    dueDate: new Date(String(inv.created_at)),
    paidDate: inv.status === 'completed' ? new Date(String(inv.created_at)) : undefined,
    invoiceNumber: inv.invoice_number ? String(inv.invoice_number) : undefined,
    createdAt: new Date(String(inv.created_at)),
    updatedAt: new Date(String(inv.updated_at)),
  }))
}

function mapPurchasedAccounts(rows: Record<string, unknown>[]): PurchasedAccount[] {
  const now = new Date()
  return rows.map((row) => {
    const expiresAt = new Date(String(row.expires_at))
    const dbStatus = row.status as PurchasedAccount['status']
    const status =
      dbStatus === 'active' && expiresAt < now ? 'expired' : dbStatus
    return {
      id: String(row.id),
      userId: String(row.user_id),
      invoiceId: row.invoice_id ? String(row.invoice_id) : undefined,
      subscriptionId: row.subscription_id ? String(row.subscription_id) : undefined,
      productId: row.product_id ? String(row.product_id) : undefined,
      productName: String(row.product_name),
      planType: (row.plan_type as PurchasedAccount['planType']) || 'monthly',
      serviceEmail: String(row.service_email),
      servicePassword: String(row.service_password),
      profileName: row.profile_name ? String(row.profile_name) : undefined,
      extraNotes: row.extra_notes ? String(row.extra_notes) : undefined,
      expiresAt,
      status,
      userRating: row.user_rating != null ? Number(row.user_rating) : undefined,
      userReview: row.user_review ? String(row.user_review) : undefined,
      ratedAt: row.rated_at ? new Date(String(row.rated_at)) : undefined,
      createdAt: new Date(String(row.created_at)),
    }
  })
}
