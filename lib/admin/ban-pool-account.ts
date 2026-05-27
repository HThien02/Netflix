import { banPurchasedAccount } from '@/lib/admin/ban-rental'
import { createAdminClient, createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

function supabaseAdmin() {
  return hasSupabaseServiceRole() ? createServiceRoleClient() : createAdminClient()
}

/** Ban một hoặc mọi gói thuê active trên tài khoản pool; có thể vô hiệu hóa pool. */
export async function banPoolAccount(input: {
  poolAccountId: string
  adminUserId: string
  banReasonId: string
  adminNote?: string
  /** Chỉ ban một rental (một slot); không disable cả pool. */
  rentalId?: string
  /** Khi true và không còn rental active, vẫn đặt pool = disabled */
  disablePool?: boolean
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase required for ban')
  }

  const supabase = supabaseAdmin()

  const { data: pool, error: poolErr } = await supabase
    .from('streaming_account_pool')
    .select('id, service_email')
    .eq('id', input.poolAccountId)
    .single()

  if (poolErr || !pool) throw new Error('Pool account not found')

  let rentalQuery = supabase
    .from('purchased_accounts')
    .select('id')
    .eq('pool_account_id', input.poolAccountId)
    .eq('status', 'active')

  if (input.rentalId) {
    rentalQuery = rentalQuery.eq('id', input.rentalId)
  }

  const { data: rentals, error: rentalErr } = await rentalQuery
  if (rentalErr) throw new Error(rentalErr.message)

  const targets = rentals || []
  let bannedCount = 0

  for (const row of targets) {
    await banPurchasedAccount({
      rentalId: row.id,
      adminUserId: input.adminUserId,
      banReasonId: input.banReasonId,
      adminNote: input.adminNote,
    })
    bannedCount += 1
  }

  const disableWholePool = Boolean(input.disablePool ?? !input.rentalId)

  if (disableWholePool) {
    const noteSuffix = input.adminNote?.trim()
      ? `\n[Ban pool ${new Date().toISOString().slice(0, 10)}] ${input.adminNote.trim()}`
      : `\n[Ban pool ${new Date().toISOString().slice(0, 10)}]`
    const { data: current } = await supabase
      .from('streaming_account_pool')
      .select('notes')
      .eq('id', input.poolAccountId)
      .single()

    await supabase
      .from('streaming_account_pool')
      .update({
        status: 'disabled',
        slots_used: 0,
        notes: `${current?.notes || ''}${noteSuffix}`.trim() || null,
      })
      .eq('id', input.poolAccountId)
  }

  if (!targets.length && !input.rentalId && !disableWholePool) {
    throw new Error('No active rentals on this account')
  }

  return { bannedCount, poolDisabled: disableWholePool }
}
