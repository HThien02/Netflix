import { completePayosOrderFromPending } from '@/lib/payos/complete-payos-order'
import { isPayosOrderAlreadyCompleted, loadPayosPendingFromDb } from '@/lib/payos/pending-store'
import { extractPayosOrderCodeFromTransfer, transferMatchesPayosOrder } from '@/lib/payos/reconcile-transfer'
import { isSepayConfigured } from '@/lib/sepay/client'

export type BankWebhookPayload = {
  code?: string | null
  content?: string | null
  transferAmount?: number
}

/** Hoàn tất đơn PayOS khi tiền vào TK (SePay webhook) nhưng PayOS UI vẫn PENDING */
export async function tryCompletePayosFromBankWebhook(payload: BankWebhookPayload) {
  if (!isSepayConfigured()) {
    return { handled: false as const, reason: 'sepay_not_configured' }
  }

  const orderCode = extractPayosOrderCodeFromTransfer(payload)
  if (!orderCode) {
    return { handled: false as const, reason: 'no_payos_order_code' }
  }

  if (await isPayosOrderAlreadyCompleted(orderCode)) {
    return { handled: true as const, orderCode, alreadyCompleted: true }
  }

  const pending = await loadPayosPendingFromDb(orderCode)
  if (!pending) {
    return { handled: false as const, reason: 'no_pending', orderCode }
  }

  const transferAmount = Number(payload.transferAmount) || 0
  if (!transferMatchesPayosOrder(transferAmount, pending.amountVnd)) {
    return {
      handled: false as const,
      reason: 'amount_mismatch',
      orderCode,
      transferAmount,
      expectedAmount: pending.amountVnd,
    }
  }

  await completePayosOrderFromPending(pending)
  return { handled: true as const, orderCode, completed: true, via: 'sepay_bank_webhook' }
}
