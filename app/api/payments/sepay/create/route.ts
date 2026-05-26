import { NextResponse } from 'next/server'
import {
  buildSepayQrImageUrl,
  buildSepayTransferDescription,
  generateSepayPaymentCode,
  getSepayBankDisplay,
  isSepayConfigured,
  resolveSepayAmountFromCart,
  SEPAY_MIN_AMOUNT_VND,
} from '@/lib/sepay/client'
import { setSepayPendingCookie } from '@/lib/sepay/pending-cookie'
import { reopenSepayPendingIfNoWebhook, saveSepayPendingToDb } from '@/lib/sepay/pending-store'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { isDemoCheckoutAllowed } from '@/lib/payments/demo-checkout'
import {
  getSessionOrNull,
  guardApiRequest,
} from '@/lib/security/request-guard'
import { sepayPaymentCreateBodySchema } from '@/lib/validation/checkout'
import { parseJsonBody } from '@/lib/validation/parse'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request, {
    auth: 'session',
    skipRateLimit: true,
  })
  if (denied) return denied

  const session = getSessionOrNull(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = await parseJsonBody(request, sepayPaymentCreateBodySchema)
  if (!parsed.ok) return parsed.response

  try {
    const body = parsed.data
    const cart = body.cart
    const userId = session.userId
    const language = body.language

    if (!isSepayConfigured()) {
      return NextResponse.json(
        {
          error:
            language === 'vi'
              ? 'Chưa cấu hình SePay trên server (SEPAY_BANK_* + SEPAY_PAYMENT_CODE_PREFIX). Thêm biến trên Vercel rồi Redeploy.'
              : 'SePay not configured on server.',
          ...(isDemoCheckoutAllowed() ? { demo: true } : {}),
        },
        { status: 503 },
      )
    }

    const { amountVnd } = resolveSepayAmountFromCart(cart)
    if (amountVnd < SEPAY_MIN_AMOUNT_VND) {
      return NextResponse.json(
        {
          error:
            language === 'vi'
              ? `Số tiền tối thiểu ${SEPAY_MIN_AMOUNT_VND.toLocaleString('vi-VN')}đ`
              : `Minimum amount ${SEPAY_MIN_AMOUNT_VND} VND`,
        },
        { status: 400 },
      )
    }

    const paymentCode = generateSepayPaymentCode()
    await reopenSepayPendingIfNoWebhook(paymentCode)
    const bank = getSepayBankDisplay()
    const qrImageUrl = buildSepayQrImageUrl(amountVnd, paymentCode)
    const pendingPayload = {
      paymentCode,
      userId,
      cart,
      productNames: body.productNames,
      language,
    }

    const saved = await saveSepayPendingToDb(pendingPayload, amountVnd)
    if (isSupabaseConfigured() && !saved.ok) {
      const detail = [saved.error, saved.hint].filter(Boolean).join(' — ')
      throw new Error(
        language === 'vi'
          ? `Không lưu được đơn chờ SePay. ${detail}`
          : `Could not save SePay pending order. ${detail}`,
      )
    }

    const transferDescription = buildSepayTransferDescription(paymentCode)
    const res = NextResponse.json({
      paymentCode,
      transferDescription,
      amountVnd,
      qrImageUrl,
      bank,
      checkoutPath: `/checkout/sepay?code=${encodeURIComponent(paymentCode)}`,
    })

    setSepayPendingCookie(res, pendingPayload)
    return res
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'SePay error' },
      { status: 500 },
    )
  }
}
