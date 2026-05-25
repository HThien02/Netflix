import { NextResponse } from 'next/server'
import { confirmPayosWebhookUrl, isPayosConfigured } from '@/lib/payos/client'
import { isPublicPayosWebhookUrl, resolvePayosWebhookUrl } from '@/lib/payos/webhook-url'

/** Đăng ký webhook PayOS — Header: x-cron-secret = CRON_SECRET */
export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret') || ''
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPayosConfigured()) {
    return NextResponse.json({ error: 'PayOS not configured' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const webhookUrl = resolvePayosWebhookUrl(
    typeof body.webhookUrl === 'string' ? body.webhookUrl : undefined,
  )

  if (!isPublicPayosWebhookUrl(webhookUrl)) {
    return NextResponse.json(
      {
        error:
          'Webhook URL phải public (ngrok/Vercel). localhost PayOS không gọi được. Đặt PAYOS_WEBHOOK_URL=https://xxx.ngrok-free.app/api/payments/payos/webhook',
        webhookUrl,
      },
      { status: 400 },
    )
  }

  try {
    const data = await confirmPayosWebhookUrl(webhookUrl)
    return NextResponse.json({
      ok: true,
      webhookUrl,
      data,
      hint: 'Kiểm tra GET webhookUrl trong trình duyệt — phải trả {"ok":true}',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Register webhook failed', webhookUrl },
      { status: 500 },
    )
  }
}

/** Kiểm tra URL webhook đang cấu hình */
export async function GET() {
  const webhookUrl = resolvePayosWebhookUrl()
  return NextResponse.json({
    webhookUrl,
    isPublic: isPublicPayosWebhookUrl(webhookUrl),
    registerHint:
      'POST /api/payments/payos/register-webhook với header x-cron-secret và body { "webhookUrl": "https://ngrok.../api/payments/payos/webhook" }',
  })
}
