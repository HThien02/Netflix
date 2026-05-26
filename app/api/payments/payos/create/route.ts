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
import { isSupabaseConfigured } from '@/lib/auth/login'
import { isDemoCheckoutAllowed } from '@/lib/payments/demo-checkout'
import { getPayosManualTransferHint } from '@/lib/payos/transfer-fallback'
import { getSiteUrl } from '@/lib/site'
import type { Cart } from '@/lib/types'
import {
  getSessionOrNull,
  guardApiRequest,
} from '@/lib/security/request-guard'

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

  try {
    const body = await request.json()
    const cart = body.cart as Cart
    const userId = session.userId
    const language = (body.language as string) || 'vi'

    if (!cart?.items?.length) {
      return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })
    }

    if (!isPayosConfigured()) {
      return NextResponse.json(
        { error: language === 'vi' ? 'Chưa cấu hình PayOS' : 'PayOS not configured', ...(isDemoCheckoutAllowed() ? { demo: true } : {}) },
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

    const appUrl = getSiteUrl()
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

    const savedPending = await savePayosPendingToDb(pendingPayload, payos.amountSent)
    if (isSupabaseConfigured() && !savedPending.ok) {
      const detail = [savedPending.error, savedPending.hint].filter(Boolean).join(' — ')
      const onVercel = Boolean(process.env.VERCEL)
      const envNote =
        savedPending.error === 'Missing SUPABASE_SERVICE_ROLE_KEY' && onVercel
          ? language === 'vi'
            ? ' (Vercel: kiểm tra biến trong môi trường Production + Redeploy; .env.local chỉ chạy local.)'
            : ' (Vercel: set variable on Production + Redeploy; .env.local is local only.)'
          : ''
      throw new Error(
        language === 'vi'
          ? `Không lưu được đơn chờ PayOS. ${detail}${envNote}`
          : `Could not save PayOS pending order. ${detail}${envNote}`,
      )
    }

    const manualTransfer = getPayosManualTransferHint(orderCode, payos.amountSent)

    const res = NextResponse.json({
      checkoutUrl: payos.checkoutUrl,
      orderCode,
      paymentLinkId: payos.paymentLinkId,
      amountVnd: payos.amountSent,
      transferMemo: manualTransfer.transferMemo,
      manualTransfer,
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
