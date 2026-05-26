import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import {
  buildSepayQrImageUrl,
  buildSepayTransferDescription,
  getSepayBankDisplay,
  isSepayConfigured,
} from '@/lib/sepay/client'
import {
  getSepayOrderStatus,
  isSepayOrderAlreadyCompleted,
  loadSepayPendingFromDb,
  reopenSepayPendingIfNoWebhook,
} from '@/lib/sepay/pending-store'
import { sepayOrderQuerySchema } from '@/lib/validation/checkout'
import { parseQuery } from '@/lib/validation/parse'

/** Lấy thông tin QR/CK theo mã — dùng khi reload trang SePay */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const query = parseQuery(url.searchParams, sepayOrderQuerySchema)
  if (!query.ok) return query.response
  const code = query.data.code

  if (!isSepayConfigured()) {
    return NextResponse.json({ error: 'SePay not configured' }, { status: 503 })
  }

  if (await isSepayOrderAlreadyCompleted(code)) {
    const row = await getSepayOrderStatus(code)
    return NextResponse.json({
      paid: true,
      paymentCode: code,
      sepayTransactionId: row?.sepayTransactionId,
    })
  }

  await reopenSepayPendingIfNoWebhook(code)
  const pending = await loadSepayPendingFromDb(code)
  if (!pending) {
    return NextResponse.json(
      {
        error:
          'Không tìm thấy đơn chờ với mã này (hết hạn hoặc chưa tạo). Quay lại checkout và thử lại.',
      },
      { status: 404 },
    )
  }

  if (pending.userId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    paymentCode: code,
    transferDescription: buildSepayTransferDescription(code),
    amountVnd: pending.amountVnd,
    qrImageUrl: buildSepayQrImageUrl(pending.amountVnd, code),
    bank: getSepayBankDisplay(),
    paid: false,
  })
}
