import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import {
  confirmPayosPaid,
  isPayosReturnCancelled,
  isPayosConfigured,
} from '@/lib/payos/client'
import {
  clearPayosPendingCookie,
  readPayosPendingCookie,
} from '@/lib/payos/pending-cookie'
import { completePayosOrderFromPending } from '@/lib/payos/complete-payos-order'
import { loadPayosPendingFromDb } from '@/lib/payos/pending-store'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { completeOrderServer } from '@/lib/orders/complete-order'

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const orderCode = Number(body.orderCode)
    const code = body.code as string | null | undefined
    const status = body.status as string | null | undefined
    const cancel = body.cancel as string | null | undefined
    const language = body.language === 'en' ? 'en' : 'vi'

    if (!orderCode) {
      return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 })
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
      return NextResponse.json(
        {
          error:
            language === 'vi'
              ? 'PayOS chưa xác nhận thanh toán. Thử tải lại trang sau 1 phút.'
              : 'PayOS has not confirmed payment yet. Retry in a minute.',
          payosStatus: data?.status,
          amountPaid: data?.amountPaid,
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
