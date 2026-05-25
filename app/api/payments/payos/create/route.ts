import { NextResponse } from 'next/server'
import {
  createPaymentLink,
  formatPayosDescription,
  generatePayosOrderCode,
  isPayosConfigured,
  PAYOS_MIN_AMOUNT_VND,
  resolvePayosAmountFromCart,
} from '@/lib/payos/client'
import { setPayosPendingCookie } from '@/lib/payos/pending-cookie'
import { savePayosPendingToDb } from '@/lib/payos/pending-store'
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

    if (!isPayosConfigured()) {
      return NextResponse.json(
        { error: language === 'vi' ? 'Chưa cấu hình PayOS' : 'PayOS not configured', demo: true },
        { status: 503 },
      )
    }

    const { amountVnd } = resolvePayosAmountFromCart(cart)
    if (amountVnd < PAYOS_MIN_AMOUNT_VND) {
      return NextResponse.json(
        {
          error:
            language === 'vi'
              ? `Số tiền tối thiểu ${PAYOS_MIN_AMOUNT_VND.toLocaleString('vi-VN')}đ (PayOS)`
              : `Minimum amount ${PAYOS_MIN_AMOUNT_VND} VND (PayOS)`,
        },
        { status: 400 },
      )
    }

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const orderCode = generatePayosOrderCode()
    const buyerName = String(body.buyerName || body.fullName || 'Khach').trim()
    const description = formatPayosDescription(orderCode)

    const returnUrl = `${appUrl}/checkout/payos-return?orderCode=${orderCode}`
    const cancelUrl = `${appUrl}/checkout?cancel=1`

    const payos = await createPaymentLink({
      orderCode,
      amountVnd,
      description,
      returnUrl,
      cancelUrl,
      buyer: {
        buyerName,
        buyerEmail: String(body.buyerEmail || body.email || '').trim(),
        buyerPhone: String(body.buyerPhone || body.phone || '').trim(),
        buyerAddress: String(
          [body.buyerAddress, body.address, body.city].filter(Boolean).join(', ') || '',
        ).trim(),
      },
    })

    const productNames = (body.productNames || {}) as Record<string, string>
    const lang = language === 'en' ? 'en' : 'vi'

    const pendingPayload = {
      orderCode,
      userId,
      cart,
      productNames,
      language: lang as 'vi' | 'en',
    }

    await savePayosPendingToDb(pendingPayload, payos.amountSent)

    const res = NextResponse.json({
      checkoutUrl: payos.checkoutUrl,
      orderCode,
      paymentLinkId: payos.paymentLinkId,
      amountVnd: payos.amountSent,
    })

    setPayosPendingCookie(res, pendingPayload)

    return res
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PayOS error' },
      { status: 500 },
    )
  }
}
