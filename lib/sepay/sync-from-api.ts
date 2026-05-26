import {
  amountMatchesOrder,
  extractPaymentCodeFromWebhook,
} from '@/lib/sepay/client'
import {
  isSepayApiConfigured,
  listSepayIncomingTransactions,
  normalizeSepayTransactionStorageId,
} from '@/lib/sepay/api-client'
import { dateMinDaysAgo } from '@/lib/sepay/transaction-stats'
import { completeSepayOrderFromPending } from '@/lib/sepay/complete-sepay-order'
import {
  isSepayOrderAlreadyCompleted,
  isSepayWebhookProcessed,
  loadSepayPendingFromDb,
  markSepayWebhookProcessed,
} from '@/lib/sepay/pending-store'

/** Chủ động hỏi SePay API khi webhook chậm / lỡ — cần SEPAY_API_TOKEN */
export async function tryCompleteSepayFromApi(paymentCode: string): Promise<{
  completed: boolean
  sepayTransactionId?: number
  via?: 'sepay_api'
}> {
  if (!isSepayApiConfigured()) {
    return { completed: false }
  }

  if (await isSepayOrderAlreadyCompleted(paymentCode)) {
    return { completed: true }
  }

  const pending = await loadSepayPendingFromDb(paymentCode)
  if (!pending) return { completed: false }

  const accountNumber = process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim()
  if (!accountNumber) return { completed: false }

  const transactions = await listSepayIncomingTransactions({
    accountNumber,
    amountInVnd: pending.amountVnd,
    limit: 50,
    transactionDateMin: dateMinDaysAgo(1),
  })

  for (const tx of transactions) {
    const extracted = extractPaymentCodeFromWebhook({
      code: tx.code,
      content: tx.transaction_content,
      description: tx.transaction_content,
    })
    if (extracted !== paymentCode) continue

    const transferAmount = Math.round(Number(tx.amount_in ?? 0))
    if (!amountMatchesOrder(transferAmount, pending.amountVnd)) continue

    const txId = normalizeSepayTransactionStorageId(tx.id)
    if (await isSepayWebhookProcessed(txId)) continue

    await completeSepayOrderFromPending(pending, txId)
    await markSepayWebhookProcessed(txId, paymentCode, transferAmount)
    console.info('[sepay api] completed order from transaction list', paymentCode, txId)
    return { completed: true, sepayTransactionId: txId, via: 'sepay_api' }
  }

  return { completed: false }
}
