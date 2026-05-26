import { createAdminClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import type { SepayPendingPayload } from '@/lib/sepay/pending-cookie'

export type SepayPendingSaveResult =
  | { ok: true }
  | { ok: false; error: string; hint?: string }

export async function saveSepayPendingToDb(
  payload: SepayPendingPayload,
  amountVnd: number,
): Promise<SepayPendingSaveResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase not configured' }
  }
  if (!hasSupabaseServiceRole()) {
    return {
      ok: false,
      error: 'Missing SUPABASE_SERVICE_ROLE_KEY',
      hint: 'Thêm service_role vào .env.local và Vercel.',
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('sepay_pending_orders').upsert(
    {
      payment_code: payload.paymentCode,
      user_id: payload.userId,
      cart: payload.cart,
      product_names: payload.productNames,
      language: payload.language,
      amount_vnd: amountVnd,
      status: 'pending',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'payment_code' },
  )

  if (error) {
    const hint =
      error.code === '42P01'
        ? 'Chạy migration sepay_pending_orders trên Supabase.'
        : undefined
    return { ok: false, error: error.message, hint }
  }
  return { ok: true }
}

export async function loadSepayPendingFromDb(
  paymentCode: string,
): Promise<(SepayPendingPayload & { amountVnd: number }) | null> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sepay_pending_orders')
    .select('payment_code, user_id, cart, product_names, language, amount_vnd, status')
    .eq('payment_code', paymentCode)
    .eq('status', 'pending')
    .maybeSingle()

  if (error || !data) return null
  return {
    paymentCode: data.payment_code,
    userId: data.user_id,
    cart: data.cart as SepayPendingPayload['cart'],
    productNames: (data.product_names || {}) as Record<string, string>,
    language: data.language === 'en' ? 'en' : 'vi',
    amountVnd: data.amount_vnd,
  }
}

/** Đọc đơn chờ kể cả khi cần hiển thị lại QR (status pending) */
export async function loadSepayPendingDisplayFromDb(
  paymentCode: string,
): Promise<(SepayPendingPayload & { amountVnd: number }) | null> {
  return loadSepayPendingFromDb(paymentCode)
}

export async function isSepayOrderAlreadyCompleted(paymentCode: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return false
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sepay_pending_orders')
    .select('status')
    .eq('payment_code', paymentCode)
    .maybeSingle()
  return data?.status === 'completed'
}

export async function markSepayPendingCompleted(
  paymentCode: string,
  sepayTransactionId?: number,
) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return
  const supabase = createAdminClient()
  await supabase
    .from('sepay_pending_orders')
    .update({
      status: 'completed',
      ...(sepayTransactionId != null ? { sepay_transaction_id: sepayTransactionId } : {}),
    })
    .eq('payment_code', paymentCode)
}

export async function isSepayWebhookProcessed(sepayTransactionId: number): Promise<boolean> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return false
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sepay_webhook_events')
    .select('sepay_transaction_id')
    .eq('sepay_transaction_id', sepayTransactionId)
    .maybeSingle()
  return Boolean(data)
}

export async function markSepayWebhookProcessed(
  sepayTransactionId: number,
  paymentCode: string,
  transferAmount: number,
) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return
  const supabase = createAdminClient()
  await supabase.from('sepay_webhook_events').upsert(
    {
      sepay_transaction_id: sepayTransactionId,
      payment_code: paymentCode,
      transfer_amount: transferAmount,
    },
    { onConflict: 'sepay_transaction_id' },
  )
}
