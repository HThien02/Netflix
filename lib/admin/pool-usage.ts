import type { SupabaseClient } from '@supabase/supabase-js'
import { purchasedAccountUserEmbed } from '@/lib/supabase/embeds'

export type SlotDetail = {
  slot_number: number
  profile_name: string
  pin?: string
}

export type SlotUsageRow = SlotDetail & {
  in_use: boolean
  rental_id?: string
  user_email?: string
  user_name?: string
  product_name?: string
  expires_at?: string
}

type RentalRow = {
  id: string
  pool_account_id: string | null
  slot_assignments: unknown
  product_name: string
  expires_at: string
  users?: { email: string; full_name: string } | { email: string; full_name: string }[] | null
}

function userOf(rental: RentalRow) {
  const u = rental.users
  if (!u) return null
  return Array.isArray(u) ? u[0] : u
}

function parseAssignments(raw: unknown): SlotDetail[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s, i) => ({
    slot_number: Number((s as SlotDetail).slot_number) || i + 1,
    profile_name: String((s as SlotDetail).profile_name || `Profile ${i + 1}`),
    pin: (s as SlotDetail).pin ? String((s as SlotDetail).pin) : undefined,
  }))
}

/** Không embed products — đã có product_name trên purchased_accounts */
export async function fetchActivePoolRentals(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('purchased_accounts')
    .select(
      `id, pool_account_id, slot_assignments, product_name, expires_at, status,
       ${purchasedAccountUserEmbed} ( email, full_name )`,
    )
    .eq('status', 'active')
    .not('pool_account_id', 'is', null)

  if (error) throw new Error(error.message)
  return (data || []) as RentalRow[]
}

export function buildSlotUsageForAccount(
  slotDetails: SlotDetail[],
  rentals: RentalRow[],
  poolAccountId: string,
): SlotUsageRow[] {
  const accountRentals = rentals.filter((r) => r.pool_account_id === poolAccountId)

  return slotDetails.map((slot) => {
    for (const rental of accountRentals) {
      const assignments = parseAssignments(rental.slot_assignments)
      const match = assignments.find((a) => a.slot_number === slot.slot_number)
      if (match) {
        const u = userOf(rental)
        return {
          ...slot,
          profile_name: match.profile_name || slot.profile_name,
          pin: match.pin ?? slot.pin,
          in_use: true,
          rental_id: rental.id,
          user_email: u?.email,
          user_name: u?.full_name,
          product_name: rental.product_name,
          expires_at: rental.expires_at,
        }
      }
    }
    return { ...slot, in_use: false }
  })
}

export async function loadProductNames(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  if (!productIds.length) return out
  const { data, error } = await supabase.from('products').select('id, name').in('id', productIds)
  if (error) throw new Error(error.message)
  for (const row of data || []) {
    if (row.id && row.name) out[row.id] = row.name
  }
  return out
}
