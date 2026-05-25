import { completeOrderServer } from '@/lib/orders/complete-order'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PayosPendingPayload } from '@/lib/payos/pending-cookie'
import { isPayosOrderAlreadyCompleted, markPayosPendingCompleted } from '@/lib/payos/pending-store'

export async function completePayosOrderFromPending(pending: PayosPendingPayload) {
  if (await isPayosOrderAlreadyCompleted(pending.orderCode)) {
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
    paymentMethod: 'payos',
  })

  await markPayosPendingCompleted(pending.orderCode)
  return result
}
