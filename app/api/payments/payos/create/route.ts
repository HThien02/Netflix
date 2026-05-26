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
import {
  getSessionOrNull,
  guardApiRequest,
} from '@/lib/security/request-guard'
import { paymentCreateBodySchema } from '@/lib/validation/checkout'
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

  const parsed = await parseJsonBody(request, paymentCreateBodySchema)
  if (!parsed.ok) return parsed.response

  try {
    const body = parsed.data
    const cart = body.cart
    const userId = session.userId
    const language = body.language

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
    const buyerName = (body.buyerName || body.fullName || 'Khach').trim()
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
        buyerEmail: body.buyerEmail || body.email || session.email,
        buyerPhone: body.buyerPhone || body.phone || '',
        buyerAddress: [body.buyerAddress, body.address].filter(Boolean).join(', '),
      },
    })

    const productNames = body.productNames
    const lang = language

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
