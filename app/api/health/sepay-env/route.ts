import { NextResponse } from 'next/server'
import { getSepayApiModeLabel, isSepayApiConfigured } from '@/lib/sepay/api-client'
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

  const apiMode = getSepayApiModeLabel()

  return NextResponse.json({
    sepayBankConfigured: isSepayConfigured(),
    sepayApiConfigured: isSepayApiConfigured(),
    sepayApiMode: apiMode,
    sepayApiTokenLength: token.length,
    sepayWebhookSecretLength: webhookSecret.length,
    hasSupabaseServiceRole: hasSupabaseServiceRole(),
    vercelEnv: process.env.VERCEL_ENV || null,
    vercelUrl: process.env.VERCEL_URL || null,
    appUrl: process.env.APP_URL || null,
    hint:
      token.length === 0
        ? 'Server KHÔNG thấy SEPAY_API_TOKEN. Vercel → Environment Variables → Production → Redeploy. Local: .env.local + restart dev.'
        : apiMode === 'sandbox'
          ? 'Token Test mode: cần SEPAY_API_MODE=sandbox. Site thật cần token Production (tắt Test mode trên my.sepay.vn).'
          : 'SEPAY_API_TOKEN OK (production).',
  })
}
