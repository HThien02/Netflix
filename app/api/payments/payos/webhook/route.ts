import { NextResponse } from 'next/server'
import { isPayosConfigured } from '@/lib/payos/client'
import { verifyPayosDataSignature } from '@/lib/payos/signature'
import { isPayosOrderAlreadyCompleted, loadPayosPendingFromDb } from '@/lib/payos/pending-store'
import { completePayosOrderFromPending } from '@/lib/payos/complete-payos-order'

/** PayOS ping / dashboard — phải trả 200 */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'payos-webhook' }, { status: 200 })
}

export async function POST(request: Request) {
  if (!isPayosConfigured()) {
    console.error('[payos webhook] PayOS env missing')
    return NextResponse.json({ error: 'PayOS not configured' }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    console.error('[payos webhook] invalid JSON body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data = body?.data as Record<string, unknown> | undefined
  const signature = String(body?.signature || '')

  if (!data || !signature) {
    console.error('[payos webhook] missing data or signature')
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const checksumKey = process.env.PAYOS_CHECKSUM_KEY!
  if (!verifyPayosDataSignature(data, signature, checksumKey)) {
    console.error('[payos webhook] signature mismatch', {
      orderCode: data.orderCode,
      hint: 'Kiểm tra PAYOS_CHECKSUM_KEY trùng kênh trên my.payos.vn',
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const orderCode = Number(data.orderCode)
  const code = String(data.code ?? '')

  console.info('[payos webhook] received', {
    orderCode,
    code: code || body.code,
    amount: data.amount,
    desc: data.desc,
  })

  if (!orderCode || (code && code !== '00')) {
    return NextResponse.json({ success: true, skipped: true, orderCode }, { status: 200 })
  }

  if (await isPayosOrderAlreadyCompleted(orderCode)) {
    return NextResponse.json({
      success: true,
      orderCode,
      completed: true,
      alreadyCompleted: true,
      message: 'Order already completed',
    })
  }

  const pending = await loadPayosPendingFromDb(orderCode)
  if (!pending) {
    console.warn('[payos webhook] no payos_pending_orders row', { orderCode })
    return NextResponse.json({
      success: true,
      orderCode,
      completed: false,
      pendingFound: false,
      hint:
        'Webhook OK nhưng không có đơn chờ với orderCode này. Dùng orderCode thật từ /api/payments/payos/create (mẫu test PayOS dùng 123).',
    })
  }

  try {
    await completePayosOrderFromPending(pending)
    console.info('[payos webhook] order completed', orderCode)
    return NextResponse.json({
      success: true,
      orderCode,
      completed: true,
      pendingFound: true,
    })
  } catch (err) {
    console.error('[payos webhook] process failed', orderCode, err)
    return NextResponse.json(
      {
        success: false,
        orderCode,
        error: err instanceof Error ? err.message : 'Complete order failed',
      },
      { status: 500 },
    )
  }
}
