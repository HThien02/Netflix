import { NextResponse } from 'next/server'
import {
  formatPayosDescription,
  getPaymentByOrderCode,
  isPayosConfigured,
  isPayosPaymentPaid,
} from '@/lib/payos/client'
import { getPayosOrderUserId } from '@/lib/payos/pending-store'
import {
  getSessionOrNull,
  guardApiRequest,
} from '@/lib/security/request-guard'
import { payosVerifyQuerySchema } from '@/lib/validation/checkout'
import { parseQuery } from '@/lib/validation/parse'

export async function GET(request: Request) {
  const denied = await guardApiRequest(request, {
    auth: 'session',
    skipRateLimit: true,
  })
  if (denied) return denied

  const session = getSessionOrNull(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const query = parseQuery(url.searchParams, payosVerifyQuerySchema)
  if (!query.ok) return query.response

  const { orderCode } = query.data

  const ownerId = await getPayosOrderUserId(orderCode)
  if (ownerId && ownerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isPayosConfigured()) {
    return NextResponse.json({ paid: true, demo: true })
  }

  const data = await getPaymentByOrderCode(orderCode)
  const paid = isPayosPaymentPaid(data)
  const expectedMemo = formatPayosDescription(orderCode)

  if (!paid) {
    const remaining = Number(data?.amountRemaining ?? data?.amount ?? 0)
    return NextResponse.json(
      {
        paid: false,
        error: 'Payment not completed',
        orderCode,
        status: data?.status,
        amount: data?.amount,
        amountPaid: data?.amountPaid ?? 0,
        amountRemaining: remaining,
        description: data?.description,
        transferMemo: expectedMemo,
        hintVi:
          remaining > 0
            ? `PayOS chưa nhận tiền (còn ${remaining.toLocaleString('vi-VN')}đ). Chuyển đúng số tiền vào TK trên trang PayOS, nội dung CK chính xác: "${expectedMemo}" (chỉ số orderCode, tối đa 9 ký tự). Mỗi lần bấm Thanh toán = link mới — không CK lại link cũ.`
            : 'PayOS chưa xác nhận thanh toán.',
        hintEn:
          remaining > 0
            ? `PayOS has not received funds (${remaining} VND remaining). Transfer the exact amount to the account on the PayOS page with transfer memo exactly: "${expectedMemo}". Each checkout creates a new link.`
            : 'PayOS has not confirmed payment yet.',
      },
      { status: 402 },
    )
  }

  return NextResponse.json({
    paid: true,
    status: data?.status,
    amount: data?.amount,
    amountPaid: data?.amountPaid,
  })
}
