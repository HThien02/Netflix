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
  const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET?.trim() || ''

  return NextResponse.json({
    sepayBankConfigured: isSepayConfigured(),
    sepayApiConfigured: isSepayApiConfigured(),
    sepayApiTokenLength: token.length,
    sepayWebhookSecretLength: webhookSecret.length,
    hasSupabaseServiceRole: hasSupabaseServiceRole(),
    vercelEnv: process.env.VERCEL_ENV || null,
    appUrl: process.env.APP_URL || null,
    hint:
      token.length === 0
        ? 'Thiếu SEPAY_API_TOKEN trên server.'
        : webhookSecret.length === 0
          ? 'Thiếu SEPAY_WEBHOOK_SECRET trên server.'
          : 'SePay env OK.',
  })
}
