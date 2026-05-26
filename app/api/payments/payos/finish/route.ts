import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  confirmPayosPaid,
  formatPayosDescription,
  isPayosReturnCancelled,
  isPayosConfigured,
} from '@/lib/payos/client'
import {
  clearPayosPendingCookie,
  readPayosPendingCookie,
} from '@/lib/payos/pending-cookie'
import { completePayosOrderFromPending } from '@/lib/payos/complete-payos-order'
import { getPayosManualTransferHint } from '@/lib/payos/transfer-fallback'
import { isPayosOrderAlreadyCompleted, loadPayosPendingFromDb } from '@/lib/payos/pending-store'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { completeOrderServer } from '@/lib/orders/complete-order'

import {
  getSessionOrNull,
  guardApiRequest,
} from '@/lib/security/request-guard'
import { payosFinishBodySchema } from '@/lib/validation/checkout'
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

  const parsed = await parseJsonBody(request, payosFinishBodySchema)
  if (!parsed.ok) return parsed.response

  try {
    const body = parsed.data
    const orderCode = body.orderCode
    const code = body.code
    const status = body.status
    const cancel = body.cancel
    const language = body.language

    if (await isPayosOrderAlreadyCompleted(orderCode)) {
      const res = NextResponse.json({
        alreadyCompleted: true,
        orderCode,
        invoice: null,
        accounts: [],
      })
      clearPayosPendingCookie(res)
      return res
    }

    if (isPayosReturnCancelled({ status, cancel })) {
      return NextResponse.json(
        { error: language === 'vi' ? 'Đã hủy thanh toán' : 'Payment cancelled' },
        { status: 400 },
      )
    }

    const cookieStore = await cookies()
    const cookieRaw = cookieStore.get('nh_payos_checkout')?.value
    let pending = cookieRaw
      ? (JSON.parse(decodeURIComponent(cookieRaw)) as ReturnType<typeof readPayosPendingCookie>)
      : null
    if (!pending) pending = readPayosPendingCookie(request)

    if (!pending) {
      pending = await loadPayosPendingFromDb(orderCode)
    }
    if (!pending && body.cart?.items?.length) {
      pending = {
        orderCode,
        userId: session.userId,
        cart: body.cart,
        productNames: (body.productNames || {}) as Record<string, string>,
        language: body.language === 'en' ? 'en' : 'vi',
      }
    }
    if (!pending || pending.orderCode !== orderCode) {
      return NextResponse.json(
        {
          error:
            language === 'vi'
              ? 'Phiên thanh toán hết hạn. Liên hệ hỗ trợ nếu đã trừ tiền.'
              : 'Checkout session expired. Contact support if charged.',
        },
        { status: 400 },
      )
    }

    if (pending.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isPayosConfigured()) {
      const result = await completeOrderServer({
        userId: pending.userId,
        userEmail: session.email,
        userName: 'Customer',
        language: pending.language,
        cart: pending.cart,
        productNames: pending.productNames,
        paymentMethod: 'payos',
      })
      const res = NextResponse.json({ ...result, savedToDb: false, demo: true })
      clearPayosPendingCookie(res)
      return res
    }

    const { paid, data } = await confirmPayosPaid(orderCode, { code, status, cancel })
    if (!paid) {
      const remaining = Number(data?.amountRemaining ?? data?.amount ?? 0)
      const memo = formatPayosDescription(orderCode)
      const manualTransfer = getPayosManualTransferHint(orderCode, remaining || pending.cart.total)
      return NextResponse.json(
        {
          error:
            language === 'vi'
              ? remaining > 0
                ? `PayOS chưa đối soát (còn ${remaining.toLocaleString('vi-VN')}đ). Nếu đã CK vào TK ngân hàng: nội dung "${memo}" — SePay sẽ hoàn tất đơn, đợi 1–5 phút rồi Thử lại.`
                : 'PayOS chưa xác nhận. Nếu đã chuyển khoản với đúng nội dung, đợi 1–5 phút rồi Thử lại.'
              : remaining > 0
                ? `PayOS pending (${remaining} VND). If you transferred manually, memo "${memo}" — wait 1–5 min and retry.`
                : 'PayOS has not confirmed payment yet. Retry in a minute.',
          payosStatus: data?.status,
          amountPaid: data?.amountPaid ?? 0,
          amountRemaining: remaining,
          transferMemo: memo,
          orderCode,
          manualTransfer,
        },
        { status: 402 },
      )
    }

    const result = await completePayosOrderFromPending(pending)

    if ('alreadyCompleted' in result && result.alreadyCompleted) {
      const res = NextResponse.json({
        alreadyCompleted: true,
        message:
          language === 'vi' ? 'Đơn đã được xử lý trước đó.' : 'Order was already processed.',
        orderCode,
      })
      clearPayosPendingCookie(res)
      return res
    }

    const res = NextResponse.json({
      ...result,
      savedToDb: isSupabaseConfigured(),
      orderCode,
    })
    clearPayosPendingCookie(res)
    return res
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Finish payment failed' },
      { status: 500 },
    )
  }
}
