import { createAdminClient } from '@/lib/supabase/admin'
import { purchasedAccountUserEmbed } from '@/lib/supabase/embeds'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { sendAccountBannedEmail } from '@/lib/email/send'
import type { Lang } from '@/lib/translations'

export async function banPurchasedAccount(input: {
  rentalId: string
  adminUserId: string
  banReasonId: string
  adminNote?: string
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase required for ban')
  }

  const supabase = createAdminClient()

  const { data: rental, error: fetchErr } = await supabase
    .from('purchased_accounts')
    .select(
      `id, user_id, product_name, plan_type, status, pool_account_id, slots_count,
       ${purchasedAccountUserEmbed} ( email, full_name, language )`,
    )
    .eq('id', input.rentalId)
    .single()

  if (fetchErr || !rental) throw new Error('Rental not found')
  if (rental.status !== 'active') throw new Error('Rental is not active')

  const { data: reason, error: reasonErr } = await supabase
    .from('ban_reasons')
    .select('*')
    .eq('id', input.banReasonId)
    .eq('is_active', true)
    .single()

  if (reasonErr || !reason) throw new Error('Ban reason not found')

  const now = new Date().toISOString()

  const { error: updateErr } = await supabase
    .from('purchased_accounts')
    .update({
      status: 'revoked',
      ban_reason_id: input.banReasonId,
      banned_at: now,
      banned_by: input.adminUserId,
      ban_admin_note: input.adminNote || null,
    })
    .eq('id', input.rentalId)

  if (updateErr) throw new Error(updateErr.message)

  if (rental.pool_account_id && rental.slots_count) {
    const { data: pool } = await supabase
      .from('streaming_account_pool')
      .select('slots_used, max_slots')
      .eq('id', rental.pool_account_id)
      .single()

    if (pool) {
      const newUsed = Math.max(0, Number(pool.slots_used) - Number(rental.slots_count))
      await supabase
        .from('streaming_account_pool')
        .update({
          slots_used: newUsed,
          status: newUsed >= Number(pool.max_slots) ? 'full' : 'active',
        })
        .eq('id', rental.pool_account_id)
    }
  }

  const u = (Array.isArray(rental.users) ? rental.users[0] : rental.users) as {
    email: string
    full_name: string
    language: string
  } | null

  if (u?.email) {
    const lang = (u.language === 'en' ? 'en' : 'vi') as Lang
    const reasonTitle = lang === 'vi' ? reason.title_vi : reason.title_en
    const reasonDesc = lang === 'vi' ? reason.description_vi : reason.description_en
    await sendAccountBannedEmail(u.email, u.full_name, lang, {
      productName: rental.product_name,
      reasonTitle,
      reasonDescription: reasonDesc || '',
      adminNote: input.adminNote || '',
    })
  }

  return { ok: true }
}
