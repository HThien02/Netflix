/** Gộp doanh thu từ invoices + đơn SePay đã hoàn tất (tránh đếm trùng). */

export type RevenueInvoiceRow = {
  final_amount: number | string
  status: string
  created_at: string
  user_id?: string
  payment_method?: string | null
}

export type SepayRevenueOrder = {
  paymentCode: string
  userId: string
  amountVnd: number
  completedAt: string
  userEmail?: string | null
  userName?: string | null
}

const COMPLETED_INVOICE = new Set(['completed', 'paid'])

/** Đơn SePay đã có hóa đơn khớp user + số tiền + thời gian → không cộng thêm. */
export function sepayOrderHasMatchingInvoice(
  order: SepayRevenueOrder,
  invoices: RevenueInvoiceRow[],
): boolean {
  const orderMs = new Date(order.completedAt).getTime()
  const windowMs = 48 * 60 * 60 * 1000

  return invoices.some((inv) => {
    if (!COMPLETED_INVOICE.has(String(inv.status))) return false
    if (String(inv.payment_method || '') !== 'sepay') return false
    if (inv.user_id && inv.user_id !== order.userId) return false
    const amount = Number(inv.final_amount) || 0
    if (Math.abs(amount - order.amountVnd) > 1) return false
    const invMs = new Date(String(inv.created_at)).getTime()
    return Math.abs(invMs - orderMs) <= windowMs
  })
}

export function sumSepayRevenueNotInInvoices(
  sepayOrders: SepayRevenueOrder[],
  invoices: RevenueInvoiceRow[],
): number {
  return sepayOrders
    .filter((o) => !sepayOrderHasMatchingInvoice(o, invoices))
    .reduce((s, o) => s + o.amountVnd, 0)
}

export function addSepayToMonthlyBuckets(
  sepayOrders: SepayRevenueOrder[],
  invoices: RevenueInvoiceRow[],
  byMonth: Map<string, { revenue: number; orders: number }>,
  monthKeyFn: (d: Date) => string,
): void {
  for (const order of sepayOrders) {
    if (sepayOrderHasMatchingInvoice(order, invoices)) continue
    const key = monthKeyFn(new Date(order.completedAt))
    const bucket = byMonth.get(key)
    if (!bucket) continue
    bucket.revenue += order.amountVnd
    bucket.orders += 1
  }
}
