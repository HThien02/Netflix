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
import type { Cart } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const cart = body.cart as Cart
    const userId = body.userId as string
    const language = (body.language as string) || 'vi'

    if (!cart?.items?.length || !userId) {
      return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })
    }

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
    const lang = language === 'en' ? 'en' : 'vi'

    const pendingPayload = {
      paymentCode,
      userId,
      cart,
      productNames: (body.productNames || {}) as Record<string, string>,
      language: lang as 'vi' | 'en',
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
