import { completeOrderServer } from '@/lib/orders/complete-order'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SepayPendingPayload } from '@/lib/sepay/pending-cookie'
import { isSepayOrderAlreadyCompleted, markSepayPendingCompleted } from '@/lib/sepay/pending-store'

export async function completeSepayOrderFromPending(
  pending: SepayPendingPayload,
  sepayTransactionId?: number,
) {
  if (await isSepayOrderAlreadyCompleted(pending.paymentCode)) {
    return { alreadyCompleted: true as const, invoice: null, accounts: [] }
  }

  let userEmail = 'customer@example.com'
  let userName = 'Customer'

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', pending.userId)
      .single()
    if (user) {
      userEmail = user.email || userEmail
      userName = user.full_name || userName
    }
  }

  const result = await completeOrderServer({
    userId: pending.userId,
    userEmail,
    userName,
    language: pending.language,
    cart: pending.cart,
    productNames: pending.productNames,
    paymentMethod: 'sepay',
  })

  await markSepayPendingCompleted(pending.paymentCode, sepayTransactionId)
  return result
}
