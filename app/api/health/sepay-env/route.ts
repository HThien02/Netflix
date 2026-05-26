import { NextResponse } from 'next/server'
import { isSepayApiConfigured } from '@/lib/sepay/api-client'
import { isSepayConfigured } from '@/lib/sepay/client'
import { getSepayApiBaseUrl, getSepayApiToken, normalizeSepaySecret } from '@/lib/sepay/env'
import { hasSupabaseServiceRole } from '@/lib/supabase/admin'

/**
 * Kiểm tra env SePay trên server đang chạy (local hoặc Vercel).
 * Header: x-cron-secret = CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret') || ''
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = getSepayApiToken()
  const webhookApiKey = normalizeSepaySecret(process.env.SEPAY_WEBHOOK_API_KEY)
  const webhookAuth = (process.env.SEPAY_WEBHOOK_AUTH || 'apikey').toLowerCase()
  const sameKey = token.length > 0 && webhookApiKey.length > 0 && token === webhookApiKey

  return NextResponse.json({
    sepayBankConfigured: isSepayConfigured(),
    sepayApiConfigured: isSepayApiConfigured(),
    sepayApiBaseUrl: getSepayApiBaseUrl(),
    sepayApiSandbox: getSepayApiBaseUrl().includes('sandbox'),
    sepayApiTokenLength: token.length,
    sepayWebhookApiKeyLength: webhookApiKey.length,
    sepayApiTokenSameAsWebhookKey: sameKey,
    sepayWebhookAuth: webhookAuth,
    hasSupabaseServiceRole: hasSupabaseServiceRole(),
    vercelEnv: process.env.VERCEL_ENV || null,
    appUrl: process.env.APP_URL || null,
    hint:
      token.length === 0
        ? 'Thiếu SEPAY_API_TOKEN — tạo tại my.sepay.vn → API Access (khác webhook key).'
        : sameKey
          ? 'SEPAY_API_TOKEN trùng webhook key — tách hai biến: API Access token vs webhook API Key.'
          : webhookApiKey.length === 0
            ? 'Thiếu SEPAY_WEBHOOK_API_KEY — đặt cùng giá trị API Key trên my.sepay.vn (webhook → Bảo mật).'
            : 'SePay env OK (chưa gọi thử API — 401 = token sai hoặc sandbox/production lệch).',
  })
}
