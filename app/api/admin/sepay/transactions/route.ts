import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSepayApiConfigured, listSepayTransactionsDetailed } from '@/lib/sepay/api-client'
import { listSepayOrdersAdmin } from '@/lib/sepay/pending-store'
import {
  dateMinDaysAgo,
  summarizeSepayTransactions,
  toSepayTxnView,
} from '@/lib/sepay/transaction-stats'

export async function GET(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminId, request)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30))
  const limit = Math.min(500, Math.max(10, Number(url.searchParams.get('limit')) || 200))

  const dbOrders = await listSepayOrdersAdmin(days)
  const dbCompleted = dbOrders.filter((o) => o.status === 'completed')
  const dbSummary = {
    totalIncoming: dbCompleted.reduce((s, o) => s + o.amountVnd, 0),
    countIncoming: dbCompleted.length,
    countPending: dbOrders.filter((o) => o.status === 'pending').length,
    orderCount: dbOrders.length,
  }

  if (!isSepayApiConfigured()) {
    return NextResponse.json({
      configured: false,
      days,
      error: 'SEPAY_API_TOKEN chưa cấu hình',
      summary: {
        totalIncoming: dbSummary.totalIncoming,
        totalOutgoing: 0,
        countIncoming: dbSummary.countIncoming,
        countOutgoing: 0,
        count: dbSummary.countIncoming,
      },
      dbSummary,
      transactions: [],
      dbOrders,
    })
  }

  const { transactions: raw, error: apiError } = await listSepayTransactionsDetailed({
    limit,
    transactionDateMin: dateMinDaysAgo(days),
  })

  const transactions = raw.map(toSepayTxnView)
  const apiSummary = summarizeSepayTransactions(transactions)
  const summary =
    apiSummary.count > 0
      ? apiSummary
      : {
          totalIncoming: dbSummary.totalIncoming,
          totalOutgoing: 0,
          countIncoming: dbSummary.countIncoming,
          countOutgoing: 0,
          count: dbSummary.countIncoming,
        }

  return NextResponse.json({
    configured: true,
    days,
    apiError: apiError || undefined,
    summary,
    apiSummary,
    dbSummary,
    transactions,
    dbOrders,
  })
}
