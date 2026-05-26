import { NextResponse } from 'next/server'
import {
  formatPayosDescription,
  getPaymentByOrderCode,
  isPayosConfigured,
  isPayosPaymentPaid,
} from '@/lib/payos/client'

export async function GET(request: Request) {
  const orderCode = Number(new URL(request.url).searchParams.get('orderCode'))
  if (!orderCode) {
    return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 })
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
