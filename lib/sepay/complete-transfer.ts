import {
  amountMatchesOrder,
  extractPaymentCodeFromWebhook,
  transferTextContainsPaymentCode,
} from '@/lib/sepay/client'
import { parseTransferAmountVnd } from '@/lib/sepay/parse-transfer'
import { completeSepayOrderFromPending } from '@/lib/sepay/complete-sepay-order'
import {
  isSepayOrderAlreadyCompleted,
  loadSepayPendingFromDb,
  markSepayWebhookProcessed,
} from '@/lib/sepay/pending-store'
import { createAdminClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

export type SepayTransferInput = {
  sepayTransactionId: number
  transferAmountVnd: number
  code?: string | null
  content?: string | null
  description?: string | null
}

/** Hoàn tất đơn từ 1 giao dịch SePay (webhook hoặc API). */
export async function tryCompleteSepayTransfer(
  paymentCode: string,
  transfer: SepayTransferInput,
): Promise<{ completed: boolean; reason?: string }> {
  const code = paymentCode.trim().toUpperCase()

  if (await isSepayOrderAlreadyCompleted(code)) {
    return { completed: true, reason: 'already_completed' }
  }

  const pending = await loadSepayPendingFromDb(code)
  if (!pending) {
    return { completed: false, reason: 'no_pending_order' }
  }

  const extracted = extractPaymentCodeFromWebhook({
    code: transfer.code,
    content: transfer.content,
    description: transfer.description,
  })

  const contentOk =
    extracted === code ||
    transferTextContainsPaymentCode(transfer.content, code) ||
    transferTextContainsPaymentCode(transfer.description, code) ||
    transferTextContainsPaymentCode(transfer.code, code)

  if (!contentOk) {
    return { completed: false, reason: 'payment_code_mismatch' }
  }

  const amount = parseTransferAmountVnd(transfer.transferAmountVnd)
  if (!amountMatchesOrder(amount, pending.amountVnd)) {
    return {
      completed: false,
      reason: `amount_mismatch:${amount}<${pending.amountVnd}`,
    }
  }

  try {
    await completeSepayOrderFromPending(pending, transfer.sepayTransactionId)
    await markSepayWebhookProcessed(transfer.sepayTransactionId, code, amount)
    return { completed: true }
  } catch (err) {
    console.error('[sepay] complete transfer failed', code, err)
    return { completed: false, reason: 'complete_order_failed' }
  }
}

/** Đã có dòng sepay_webhook_events nhưng đơn vẫn pending — thử hoàn tất lại. */
export async function tryCompleteFromStoredWebhookEvent(
  paymentCode: string,
): Promise<{ completed: boolean }> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return { completed: false }
  }

  const code = paymentCode.trim().toUpperCase()
  if (await isSepayOrderAlreadyCompleted(code)) {
    return { completed: true }
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sepay_webhook_events')
    .select('sepay_transaction_id, transfer_amount, payment_code')
    .eq('payment_code', code)
    .order('processed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.sepay_transaction_id) {
    return { completed: false }
  }

  const result = await tryCompleteSepayTransfer(code, {
    sepayTransactionId: data.sepay_transaction_id,
    transferAmountVnd: data.transfer_amount,
    content: code,
    code,
  })
  return { completed: result.completed }
}
