import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import { isSepayApiConfigured } from '@/lib/sepay/api-client'
import { getSepayOrderStatus, isSepayOrderAlreadyCompleted } from '@/lib/sepay/pending-store'
import { tryCompleteSepayFromApi } from '@/lib/sepay/sync-from-api'

export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  let row = await getSepayOrderStatus(code)
  let paid = await isSepayOrderAlreadyCompleted(code)

  if (!paid) {
    const synced = await tryCompleteSepayFromApi(code)
    if (synced.completed) {
      row = await getSepayOrderStatus(code)
      paid = true
    }
  }

  if (paid) {
    const sepayTransactionId = row?.sepayTransactionId
    if (sepayTransactionId != null) {
      return NextResponse.json({
        paid: true,
        paymentCode: code,
        sepayTransactionId,
      })
    }
  }

  return NextResponse.json(
    {
      paid: false,
      paymentCode: code,
      status: row?.status === 'completed' ? 'COMPLETED_NO_WEBHOOK' : 'PENDING',
      hintVi:
        row?.status === 'completed'
          ? 'Đơn đánh dấu hoàn tất nhưng chưa có mã giao dịch SePay — chưa CK thật. Chuyển khoản đúng mã và số tiền.'
          : isSepayApiConfigured()
            ? 'Chưa thấy CK khớp mã và số tiền trên SePay. Kiểm tra nội dung CK, đợi 1–5 phút.'
            : 'Chưa nhận webhook SePay. Thêm SEPAY_API_TOKEN (my.sepay.vn → API) hoặc cấu hình webhook đúng URL trên dashboard.',
      sepayApiConfigured: isSepayApiConfigured(),
    },
    { status: 402 },
  )
}
