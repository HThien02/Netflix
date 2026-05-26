import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import { resolveSepayWebhookUrl } from '@/lib/sepay/webhook-url'
import { getSepayOrderStatus, isSepayOrderAlreadyCompleted } from '@/lib/sepay/pending-store'
import { tryCompleteSepayFromApi } from '@/lib/sepay/sync-from-api'

/** Chỉ đọc DB — không gọi SePay API (tránh “tự checkout”). Dùng ?sync=1 khi bấm kiểm tra thủ công. */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const allowApiSync = url.searchParams.get('sync') === '1'

  let row = await getSepayOrderStatus(code)
  let paid = await isSepayOrderAlreadyCompleted(code)

  if (!paid && allowApiSync) {
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
        'Chờ webhook SePay hoàn tất đơn. Trên my.sepay.vn webhook phải là ' +
        resolveSepayWebhookUrl() +
        ' (KHÔNG dùng /api/payments/payos/webhook). URL không www có thể bị Redirect — dùng www.',
      sepayWebhookUrl: resolveSepayWebhookUrl(),
    },
    { status: 402 },
  )
}
