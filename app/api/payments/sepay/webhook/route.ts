import { NextResponse } from 'next/server'
import { tryCompletePayosFromBankWebhook } from '@/lib/payos/complete-from-bank-webhook'
import { extractPaymentCodeFromWebhook } from '@/lib/sepay/client'
import { tryCompleteSepayTransfer } from '@/lib/sepay/complete-transfer'
import { parseTransferAmountVnd } from '@/lib/sepay/parse-transfer'
import { verifySepayWebhookRequest } from '@/lib/sepay/signature'
import { sepayWebhookOk } from '@/lib/sepay/webhook-response'
import {
  isSepayOrderAlreadyCompleted,
  isSepayWebhookProcessed,
  markSepayWebhookProcessed,
} from '@/lib/sepay/pending-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Đúng schema SePay — https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook */
export type SepayWebhookPayload = {
  id: number
  gateway?: string
  transactionDate?: string
  accountNumber?: string
  subAccount?: string | null
  /** Mã SePay trích theo Cấu trúc mã TT trên my.sepay.vn — có thể null; app vẫn đọc NH... từ content */
  code?: string | null
  content?: string
  transferType?: 'in' | 'out' | string
  description?: string
  transferAmount?: number
  accumulated?: number
  referenceCode?: string
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sepay-webhook',
    correctUrl: 'https://www.netflixhub.com.vn/api/payments/sepay/webhook',
    message: 'POST JSON — xác thực Apikey (SEPAY_WEBHOOK_API_KEY)',
  })
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const auth = verifySepayWebhookRequest(request, rawBody)
  if (!auth.ok) {
    console.warn('[sepay webhook] auth failed', auth.message)
    return NextResponse.json(
      { success: false, message: auth.message },
      { status: 401 },
    )
  }

  let payload: SepayWebhookPayload
  try {
    payload = JSON.parse(rawBody) as SepayWebhookPayload
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON' },
      { status: 400 },
    )
  }

  const txId = Number(payload.id)
  if (!txId) {
    return NextResponse.json(
      { success: false, message: 'Missing transaction id' },
      { status: 400 },
    )
  }

  if (payload.transferType && payload.transferType !== 'in') {
    console.info('[sepay webhook] skipped not_incoming', txId)
    return sepayWebhookOk()
  }

  const paymentCode = extractPaymentCodeFromWebhook({
    code: payload.code,
    content: payload.content,
    description: payload.description,
  })

  if (!paymentCode) {
    const payosResult = await tryCompletePayosFromBankWebhook({
      code: payload.code,
      content: payload.content,
      transferAmount: payload.transferAmount,
    })
    if (payosResult.handled && payosResult.completed) {
      await markSepayWebhookProcessed(
        txId,
        `PAYOS-${payosResult.orderCode}`,
        parseTransferAmountVnd(payload.transferAmount),
      )
      return sepayWebhookOk()
    }
    console.info('[sepay webhook] no payment code', {
      id: txId,
      code: payload.code,
      content: payload.content?.slice(0, 160),
      description: payload.description?.slice(0, 80),
    })
    return sepayWebhookOk()
  }

  if (await isSepayWebhookProcessed(txId)) {
    if (await isSepayOrderAlreadyCompleted(paymentCode)) {
      console.info('[sepay webhook] duplicate tx, order done', txId, paymentCode)
      return sepayWebhookOk()
    }
    console.warn('[sepay webhook] duplicate tx but order still pending', txId, paymentCode)
  }

  const result = await tryCompleteSepayTransfer(paymentCode, {
    sepayTransactionId: txId,
    transferAmountVnd: parseTransferAmountVnd(payload.transferAmount),
    code: payload.code,
    content: payload.content,
    description: payload.description,
  })

  if (result.completed) {
    console.info('[sepay webhook] order completed', paymentCode, txId)
    return sepayWebhookOk()
  }

  console.warn('[sepay webhook] not completed', {
    paymentCode,
    txId,
    reason: result.reason,
    transferAmount: payload.transferAmount,
    content: payload.content?.slice(0, 160),
    sepayCodeField: payload.code,
  })

  return sepayWebhookOk()
}
