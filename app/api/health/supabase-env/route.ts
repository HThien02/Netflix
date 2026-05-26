import { NextResponse } from 'next/server'
import { hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

/**
 * Kiểm tra env Supabase trên server (prod/local).
 * Header: x-cron-secret = CRON_SECRET
 * Không trả về giá trị key, chỉ có/không.
 */
export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret') || ''
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured(),
    hasServiceRoleKey: hasSupabaseServiceRole(),
    serviceRoleKeyLength: serviceKey.length,
    anonKeyLength: anonKey.length,
    supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    vercelEnv: process.env.VERCEL_ENV || null,
    nodeEnv: process.env.NODE_ENV || null,
    hint:
      !hasSupabaseServiceRole() && isSupabaseConfigured()
        ? 'Server không thấy SUPABASE_SERVICE_ROLE_KEY. Trên Vercel: Settings → Environment Variables → Production → Redeploy.'
        : hasSupabaseServiceRole()
          ? 'OK — API PayOS có thể ghi payos_pending_orders.'
          : 'Chưa cấu hình Supabase URL/anon key.',
  })
}
