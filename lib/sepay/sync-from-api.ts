import { transferTextContainsPaymentCode } from '@/lib/sepay/client'
import {
  findSepayTransactionsByPaymentCode,
  isSepayApiConfigured,
  normalizeSepayTransactionStorageId,
} from '@/lib/sepay/api-client'
import { tryCompleteSepayTransfer } from '@/lib/sepay/complete-transfer'
import { parseTransferAmountVnd } from '@/lib/sepay/parse-transfer'
import { isSepayOrderAlreadyCompleted, loadSepayPendingFromDb } from '@/lib/sepay/pending-store'

/** Đồng bộ từ SePay API khi webhook đã nhận tiền nhưng đơn chưa completed. */
export async function tryCompleteSepayFromApi(paymentCode: string): Promise<{
  completed: boolean
  sepayTransactionId?: number
  via?: 'sepay_api'
}> {
  if (!isSepayApiConfigured()) {
    return { completed: false }
  }

  const code = paymentCode.trim().toUpperCase()

  if (await isSepayOrderAlreadyCompleted(code)) {
    return { completed: true }
  }

  const pending = await loadSepayPendingFromDb(code)
  if (!pending) return { completed: false }

  const accountNumber = process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim()
  if (!accountNumber) return { completed: false }

  const transactions = await findSepayTransactionsByPaymentCode(code, accountNumber)

  for (const tx of transactions) {
    const text = `${tx.transaction_content || ''} ${tx.code || ''} ${tx.reference_number || ''}`
    if (!transferTextContainsPaymentCode(text, code)) continue

    const transferAmount = parseTransferAmountVnd(tx.amount_in)
    if (transferAmount <= 0) continue

    const txId = normalizeSepayTransactionStorageId(tx.id)

    const result = await tryCompleteSepayTransfer(code, {
      sepayTransactionId: txId,
      transferAmountVnd: transferAmount,
      code: tx.code,
      content: tx.transaction_content,
      description: tx.transaction_content,
    })

    if (result.completed) {
      console.info('[sepay api] completed order', code, txId)
      return { completed: true, sepayTransactionId: txId, via: 'sepay_api' }
    }
  }

  return { completed: false }
}
