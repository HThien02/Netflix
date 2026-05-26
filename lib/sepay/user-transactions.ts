import {
  listSepayTransactionsDetailed,
  isSepayApiConfigured,
  normalizeSepayTransactionStorageId,
} from '@/lib/sepay/api-client'
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
  apiError?: string
}> {
  const orders = await listSepayOrdersByUser(userId)
  const codes = new Set(orders.map((o) => o.paymentCode.toUpperCase()))
  const txIds = new Set(
    orders.map((o) => o.sepayTransactionId).filter((id): id is number => id != null),
  )

  const completed = orders.filter((o) => o.status === 'completed')
  const dbSummary: SepayTxnSummary = {
    totalIncoming: completed.reduce((s, o) => s + o.amountVnd, 0),
    totalOutgoing: 0,
    countIncoming: completed.length,
    countOutgoing: 0,
    count: completed.length,
  }

  if (!isSepayApiConfigured()) {
    return {
      configured: false,
      orders,
      bankTransactions: [],
      summary: dbSummary,
    }
  }

  const { transactions: raw, error: apiError } = await listSepayTransactionsDetailed({
    limit: 300,
    transactionDateMin: dateMinDaysAgo(days),
  })

  const bankTransactions = raw
    .map(toSepayTxnView)
    .filter((tx) => {
      const storedId = normalizeSepayTransactionStorageId(tx.id)
      if (txIds.has(storedId)) return true
      if (tx.paymentCode && codes.has(tx.paymentCode.toUpperCase())) return true
      const upperContent = tx.content.toUpperCase()
      for (const code of codes) {
        if (upperContent.includes(code)) return true
      }
      return false
    })

  const bankSummary = summarizeSepayTransactions(bankTransactions)
  const summary =
    bankSummary.totalIncoming > 0
      ? bankSummary
      : dbSummary

  return {
    configured: true,
    orders,
    bankTransactions,
    summary,
    apiError,
  }
}
