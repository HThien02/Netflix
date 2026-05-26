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

  let apiSync: { completed: boolean; via?: string } | null = null
  if (!paid) {
    const synced = await tryCompleteSepayFromApi(code)
    apiSync = { completed: synced.completed, via: synced.via }
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

  const apiOn = isSepayApiConfigured()
  const onVercel = Boolean(process.env.VERCEL)
  const envHint = !apiOn
    ? onVercel
      ? 'Server production (Vercel) chưa có SEPAY_API_TOKEN — thêm trong Vercel → Environment Variables → Production rồi Redeploy (file .env.local chỉ chạy trên máy bạn).'
      : 'Server local chưa đọc SEPAY_API_TOKEN — kiểm tra .env.local và khởi động lại npm run dev.'
    : apiSync?.completed === false
      ? 'Đã gọi API SePay nhưng chưa thấy CK khớp mã NH và số tiền. Kiểm tra nội dung CK đúng "Thanh toan don hang ' +
        code +
        '".'
      : 'Chưa nhận webhook và chưa khớp API. Đợi 1–5 phút hoặc kiểm tra webhook trên my.sepay.vn.'

  return NextResponse.json(
    {
      paid: false,
      paymentCode: code,
      status: row?.status === 'completed' ? 'COMPLETED_NO_WEBHOOK' : 'PENDING',
      hintVi:
        row?.status === 'completed'
          ? 'Đơn đánh dấu hoàn tất nhưng chưa có mã giao dịch SePay — chưa CK thật. Chuyển khoản đúng mã và số tiền.'
          : envHint,
      sepayApiConfigured: apiOn,
      deployment: onVercel ? 'vercel' : 'local',
      apiSyncAttempted: apiOn,
    },
    { status: 402 },
  )
}
