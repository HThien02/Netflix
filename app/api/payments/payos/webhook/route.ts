import { after, NextResponse } from 'next/server'
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

  // PayOS yêu cầu HTTP 2xx nhanh — xử lý đơn ở background
  if (orderCode && (!code || code === '00')) {
    after(async () => {
      try {
        if (await isPayosOrderAlreadyCompleted(orderCode)) return
        const pending = await loadPayosPendingFromDb(orderCode)
        if (!pending) {
          console.info('[payos webhook] no pending row for orderCode', orderCode)
          return
        }
        await completePayosOrderFromPending(pending)
        console.info('[payos webhook] order completed', orderCode)
      } catch (err) {
        console.error('[payos webhook] process failed', orderCode, err)
      }
    })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
