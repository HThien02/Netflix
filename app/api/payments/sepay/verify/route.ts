import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import { isSepayApiConfigured } from '@/lib/sepay/api-client'
import { getSepayOrderStatus, isSepayOrderAlreadyCompleted } from '@/lib/sepay/pending-store'
import { tryCompleteSepayFromApi } from '@/lib/sepay/sync-from-api'

const POLL_INTERVAL_MS = 2000
const MAX_WAIT_SEC = 90

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resolvePaidState(code: string) {
  let row = await getSepayOrderStatus(code)
  let paid = await isSepayOrderAlreadyCompleted(code)

  if (!paid && isSepayApiConfigured()) {
    const synced = await tryCompleteSepayFromApi(code)
    if (synced.completed) {
      row = await getSepayOrderStatus(code)
      paid = true
    }
  }

  return { row, paid }
}

/**
 * Kiểm tra đơn SePay.
 * ?wait=55 — giữ kết nối, kiểm tra lại mỗi 2s tối đa 55s (chờ webhook xử lý xong rồi mới trả).
 */
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

  const waitRaw = parseInt(url.searchParams.get('wait') || '0', 10)
  const waitSec = Number.isFinite(waitRaw)
    ? Math.min(MAX_WAIT_SEC, Math.max(0, waitRaw))
    : 0

  let { row, paid } = await resolvePaidState(code)

  if (!paid && waitSec > 0) {
    const deadline = Date.now() + waitSec * 1000
    while (Date.now() < deadline && !paid) {
      await sleep(POLL_INTERVAL_MS)
      const next = await resolvePaidState(code)
      row = next.row
      paid = next.paid
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
      waitedSeconds: waitSec,
      hintVi:
        row == null
          ? 'Không tìm thấy đơn chờ với mã này — tạo lại từ giỏ hàng.'
          : 'Chưa thấy tiền vào hoặc nội dung CK chưa khớp mã. Kiểm tra đúng số tiền và nội dung "Thanh toan don hang ' +
            code +
            '".',
      noteVi:
        'Response {"success":true} trên my.sepay.vn là webhook server→server — trình duyệt không nhận được; trang chờ qua API verify này.',
      sepayApiSync: isSepayApiConfigured(),
    },
    { status: 402 },
  )
}
