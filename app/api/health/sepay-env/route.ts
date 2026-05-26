import { NextResponse } from 'next/server'
import { isSepayApiConfigured } from '@/lib/sepay/api-client'
import { isSepayConfigured } from '@/lib/sepay/client'
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

  const token = process.env.SEPAY_API_TOKEN?.trim() || ''
  const webhookApiKey = process.env.SEPAY_WEBHOOK_API_KEY?.trim() || ''
  const webhookAuth = (process.env.SEPAY_WEBHOOK_AUTH || 'apikey').toLowerCase()

  return NextResponse.json({
    sepayBankConfigured: isSepayConfigured(),
    sepayApiConfigured: isSepayApiConfigured(),
    sepayApiTokenLength: token.length,
    sepayWebhookApiKeyLength: webhookApiKey.length,
    sepayWebhookAuth: webhookAuth,
    hasSupabaseServiceRole: hasSupabaseServiceRole(),
    vercelEnv: process.env.VERCEL_ENV || null,
    appUrl: process.env.APP_URL || null,
    hint:
      token.length === 0
        ? 'Thiếu SEPAY_API_TOKEN trên server.'
        : webhookApiKey.length === 0
          ? 'Thiếu SEPAY_WEBHOOK_API_KEY — đặt cùng giá trị API Key trên my.sepay.vn (webhook → Bảo mật).'
          : 'SePay env OK.',
  })
}
