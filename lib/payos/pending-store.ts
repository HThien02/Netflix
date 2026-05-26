import { createAdminClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import type { PayosPendingPayload } from '@/lib/payos/pending-cookie'

export type PayosPendingSaveResult =
  | { ok: true }
  | { ok: false; error: string; hint?: string }

export async function savePayosPendingToDb(
  payload: PayosPendingPayload,
  amountVnd: number,
): Promise<PayosPendingSaveResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase not configured' }
  }
  if (!hasSupabaseServiceRole()) {
    return {
      ok: false,
      error: 'Missing SUPABASE_SERVICE_ROLE_KEY',
      hint:
        'Thêm service_role key vào .env.local và Vercel (Supabase → Settings → API). Anon/publishable key không ghi được payos_pending_orders khi bật RLS.',
    }
  }
  const supabase = createAdminClient()
  const { error } = await supabase.from('payos_pending_orders').upsert(
    {
      order_code: payload.orderCode,
      user_id: payload.userId,
      cart: payload.cart,
      product_names: payload.productNames,
      language: payload.language,
      amount_vnd: amountVnd,
      status: 'pending',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'order_code' },
  )
  if (error) {
    console.error('[payos pending] save failed', error.message, error.code)
    const hint =
      error.code === '42501'
        ? 'RLS chặn ghi — cần SUPABASE_SERVICE_ROLE_KEY (không dùng anon/publishable).'
        : error.code === '23503'
          ? 'user_id không có trong bảng users — đăng nhập/đăng ký lại qua Supabase.'
          : error.code === '42P01'
            ? 'Chạy migration payos_pending_orders trên Supabase.'
            : undefined
    return { ok: false, error: error.message, hint }
  }
  return { ok: true }
}

export async function loadPayosPendingFromDb(
  orderCode: number,
): Promise<PayosPendingPayload | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('payos_pending_orders')
    .select('order_code, user_id, cart, product_names, language, status')
    .eq('order_code', orderCode)
    .eq('status', 'pending')
    .maybeSingle()

  if (error || !data) return null
  return {
    orderCode: Number(data.order_code),
    userId: data.user_id,
    cart: data.cart as PayosPendingPayload['cart'],
    productNames: (data.product_names || {}) as Record<string, string>,
    language: data.language === 'en' ? 'en' : 'vi',
  }
}

export async function isPayosOrderAlreadyCompleted(orderCode: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('payos_pending_orders')
    .select('status')
    .eq('order_code', orderCode)
    .maybeSingle()
  return data?.status === 'completed'
}

export async function markPayosPendingCompleted(orderCode: number) {
  if (!isSupabaseConfigured()) return
  const supabase = createAdminClient()
  await supabase
    .from('payos_pending_orders')
    .update({ status: 'completed' })
    .eq('order_code', orderCode)
}
