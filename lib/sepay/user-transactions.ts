import { listSepayTransactions, isSepayApiConfigured } from '@/lib/sepay/api-client'
import { listSepayOrdersByUser } from '@/lib/sepay/pending-store'
import {
  dateMinDaysAgo,
  summarizeSepayTransactions,
  toSepayTxnView,
  type SepayTxnSummary,
  type SepayTxnView,
} from '@/lib/sepay/transaction-stats'

export type UserSepayPaymentRow = {
  paymentCode: string
  amountVnd: number
  status: string
  sepayTransactionId: number | null
  createdAt: string
}

export async function getUserSepayTransactionReport(
  userId: string,
  days = 90,
): Promise<{
  configured: boolean
  orders: UserSepayPaymentRow[]
  bankTransactions: SepayTxnView[]
  summary: SepayTxnSummary
}> {
  const orders = await listSepayOrdersByUser(userId)
  const codes = new Set(orders.map((o) => o.paymentCode.toUpperCase()))
  const txIds = new Set(
    orders.map((o) => o.sepayTransactionId).filter((id): id is number => id != null),
  )

  if (!isSepayApiConfigured()) {
    const completed = orders.filter((o) => o.status === 'completed')
    return {
      configured: false,
      orders,
      bankTransactions: [],
      summary: {
        totalIncoming: completed.reduce((s, o) => s + o.amountVnd, 0),
        totalOutgoing: 0,
        countIncoming: completed.length,
        countOutgoing: 0,
        count: completed.length,
      },
    }
  }

  const raw = await listSepayTransactions({
    limit: 200,
    transactionDateMin: dateMinDaysAgo(days),
  })

  const bankTransactions = raw
    .map(toSepayTxnView)
    .filter((tx) => {
      if (txIds.has(Number(tx.id))) return true
      if (tx.paymentCode && codes.has(tx.paymentCode)) return true
      return false
    })

  return {
    configured: true,
    orders,
    bankTransactions,
    summary: summarizeSepayTransactions(bankTransactions),
  }
}
