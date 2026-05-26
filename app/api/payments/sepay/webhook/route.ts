import { NextResponse } from 'next/server'
import { tryCompletePayosFromBankWebhook } from '@/lib/payos/complete-from-bank-webhook'
import {
  amountMatchesOrder,
  extractPaymentCodeFromWebhook,
} from '@/lib/sepay/client'
import { completeSepayOrderFromPending } from '@/lib/sepay/complete-sepay-order'
import { verifySepayWebhookRequest } from '@/lib/sepay/signature'
import {
  isSepayOrderAlreadyCompleted,
  isSepayWebhookProcessed,
  loadSepayPendingFromDb,
  markSepayWebhookProcessed,
} from '@/lib/sepay/pending-store'

export type SepayWebhookPayload = {
  id: number
  gateway?: string
  transactionDate?: string
  accountNumber?: string
  code?: string | null
  content?: string
  transferType?: string
  transferAmount?: number
  description?: string
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sepay-webhook',
    message: 'POST JSON webhook from SePay dashboard',
  })
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const auth = verifySepayWebhookRequest(request, rawBody)
  if (!auth.ok) {
    console.warn('[sepay webhook] auth failed', auth.message)
    return NextResponse.json({ success: false, message: auth.message }, { status: 401 })
  }

  let payload: SepayWebhookPayload
  try {
    payload = JSON.parse(rawBody) as SepayWebhookPayload
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.transferType && payload.transferType !== 'in') {
    return NextResponse.json({ success: true, skipped: true, reason: 'not_incoming' })
  }

  const txId = Number(payload.id)
  if (!txId) {
    return NextResponse.json({ success: false, message: 'Missing transaction id' }, { status: 400 })
  }

  const paymentCode = extractPaymentCodeFromWebhook(payload)

  if (await isSepayWebhookProcessed(txId)) {
    if (paymentCode && (await isSepayOrderAlreadyCompleted(paymentCode))) {
      return NextResponse.json({ success: true, duplicate: true, transactionId: txId })
    }
    if (!paymentCode) {
      return NextResponse.json({ success: true, duplicate: true, transactionId: txId })
    }
  }

  if (!paymentCode) {
    const payosResult = await tryCompletePayosFromBankWebhook({
      code: payload.code,
      content: payload.content,
      transferAmount: payload.transferAmount,
    })
    if (payosResult.handled && payosResult.completed) {
      await markSepayWebhookProcessed(txId, `PAYOS-${payosResult.orderCode}`, Number(payload.transferAmount) || 0)
      console.info('[sepay webhook] completed PayOS order via bank transfer', payosResult.orderCode)
      return NextResponse.json({
        success: true,
        completed: true,
        payosOrderCode: payosResult.orderCode,
        via: 'sepay_bank_webhook',
      })
    }
    console.info('[sepay webhook] no payment code in payload', { id: txId, code: payload.code, payosResult })
    return NextResponse.json({ success: true, skipped: true, reason: 'no_payment_code' })
  }

  if (await isSepayOrderAlreadyCompleted(paymentCode)) {
    return NextResponse.json({ success: true, paymentCode, alreadyCompleted: true })
  }

  const pending = await loadSepayPendingFromDb(paymentCode)
  if (!pending) {
    const payosResult = await tryCompletePayosFromBankWebhook({
      code: payload.code,
      content: payload.content,
      transferAmount: payload.transferAmount,
    })
    if (payosResult.handled && payosResult.completed) {
      await markSepayWebhookProcessed(txId, `PAYOS-${payosResult.orderCode}`, Number(payload.transferAmount) || 0)
      return NextResponse.json({
        success: true,
        completed: true,
        payosOrderCode: payosResult.orderCode,
        via: 'sepay_bank_webhook',
      })
    }
    console.warn('[sepay webhook] no pending order', { paymentCode, txId })
    return NextResponse.json({
      success: true,
      paymentCode,
      pendingFound: false,
      hint: 'Không có đơn chờ với mã CK này hoặc đã hết hạn.',
    })
  }

  const transferAmount = Number(payload.transferAmount) || 0
  if (!amountMatchesOrder(transferAmount, pending.amountVnd)) {
    console.warn('[sepay webhook] amount mismatch', {
      paymentCode,
      transferAmount,
      expected: pending.amountVnd,
    })
    return NextResponse.json({
      success: true,
      paymentCode,
      completed: false,
      reason: 'amount_mismatch',
      transferAmount,
      expectedAmount: pending.amountVnd,
    })
  }

  try {
    await completeSepayOrderFromPending(pending, txId)
    await markSepayWebhookProcessed(txId, paymentCode, transferAmount)
    console.info('[sepay webhook] order completed', paymentCode, txId)
    return NextResponse.json({ success: true, paymentCode, completed: true })
  } catch (err) {
    console.error('[sepay webhook] complete failed', paymentCode, err)
    return NextResponse.json(
      {
        success: false,
        paymentCode,
        error: err instanceof Error ? err.message : 'Complete order failed',
      },
      { status: 500 },
    )
  }
}
