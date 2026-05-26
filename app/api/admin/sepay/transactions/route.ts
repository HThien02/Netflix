import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSepayApiConfigured, listSepayTransactions } from '@/lib/sepay/api-client'
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

  if (!isSepayApiConfigured()) {
    return NextResponse.json(
      {
        error: 'SEPAY_API_TOKEN chưa cấu hình',
        configured: false,
      },
      { status: 503 },
    )
  }

  const url = new URL(request.url)
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30))
  const limit = Math.min(500, Math.max(10, Number(url.searchParams.get('limit')) || 150))

  const raw = await listSepayTransactions({
    limit,
    transactionDateMin: dateMinDaysAgo(days),
  })

  const transactions = raw.map(toSepayTxnView)
  const summary = summarizeSepayTransactions(transactions)

  return NextResponse.json({
    configured: true,
    days,
    summary,
    transactions,
  })
}
