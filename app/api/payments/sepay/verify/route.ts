import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import { getSepayOrderStatus, isSepayOrderAlreadyCompleted } from '@/lib/sepay/pending-store'

export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const row = await getSepayOrderStatus(code)
  const paid = await isSepayOrderAlreadyCompleted(code)

  if (paid && row?.sepayTransactionId) {
    return NextResponse.json({
      paid: true,
      paymentCode: code,
      sepayTransactionId: row.sepayTransactionId,
    })
  }

  return NextResponse.json(
    {
      paid: false,
      paymentCode: code,
      status: row?.status === 'completed' ? 'COMPLETED_NO_WEBHOOK' : 'PENDING',
      hintVi:
        row?.status === 'completed'
          ? 'Đơn đánh dấu hoàn tất nhưng chưa có mã giao dịch SePay — chưa CK thật. Chuyển khoản đúng mã và số tiền.'
          : 'Chưa nhận được CK hoặc SePay chưa gửi webhook. Kiểm tra đúng số tiền và nội dung CK, đợi 1–5 phút.',
    },
    { status: 402 },
  )
}
