import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { isShortTermPlan, type PlanType } from '@/lib/plans'

export type SlotDetail = {
  slot_number: number
  profile_name: string
  pin?: string
}

export type PoolAccount = {
  id: string
  product_id: string | null
  service_email: string
  service_password: string
  max_slots: number
  slots_used: number
  slot_details: SlotDetail[]
  status: string
}

export type SlotAllocation = {
  poolAccountId: string
  serviceEmail: string
  servicePassword: string
  slotsCount: number
  assignedSlots: SlotDetail[]
  freeSlotsBefore: number
}

const MIN_SPARE_TARGETS = [1, 2, 3, 4] as const

function freeSlots(row: { max_slots: number; slots_used: number }) {
  return row.max_slots - row.slots_used
}

function freeSlotsAccount(a: PoolAccount) {
  return a.max_slots - a.slots_used
}

function parseSlotDetails(raw: unknown): SlotDetail[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s, i) => ({
    slot_number: Number((s as SlotDetail).slot_number) || i + 1,
    profile_name: String((s as SlotDetail).profile_name || `Profile ${i + 1}`),
    pin: (s as SlotDetail).pin ? String((s as SlotDetail).pin) : undefined,
  }))
}

function defaultSlotDetails(maxSlots: number): SlotDetail[] {
  return Array.from({ length: maxSlots }, (_, i) => ({
    slot_number: i + 1,
    profile_name: `Profile ${i + 1}`,
    pin: `${1000 + i}`,
  }))
}

/** Các lựa chọn slot user có thể mua (1–4) theo tồn kho thực tế */
export async function getAvailableSlotOptions(productId?: string): Promise<number[]> {
  const pool = await loadPool(productId)
  const options = new Set<number>()
  for (const row of pool) {
    const free = freeSlotsAccount(row)
    for (let s = 1; s <= Math.min(4, free); s++) options.add(s)
  }
  return [...options].sort((a, b) => a - b)
}

export async function loadPool(productId?: string): Promise<PoolAccount[]> {
  if (!isSupabaseConfigured()) return getLocalFallbackPool()

  try {
    const supabase = createAdminClient()
    let q = supabase
      .from('streaming_account_pool')
      .select('*')
      .eq('status', 'active')
      .order('slots_used', { ascending: true })

    if (productId) q = q.eq('product_id', productId)

    const { data, error } = await q
    if (error || !data?.length) return getLocalFallbackPool()
    return data.map(mapPoolRow)
  } catch {
    return getLocalFallbackPool()
  }
}

function mapPoolRow(row: Record<string, unknown>): PoolAccount {
  const max_slots = Number(row.max_slots) || 4
  const details = parseSlotDetails(row.slot_details)
  return {
    id: String(row.id),
    product_id: row.product_id ? String(row.product_id) : null,
    service_email: String(row.service_email),
    service_password: String(row.service_password),
    max_slots,
    slots_used: Number(row.slots_used) || 0,
    slot_details: details.length ? details : defaultSlotDetails(max_slots),
    status: String(row.status),
  }
}

/**
 * Chọn account có đủ slot trống; ưu tiên khớp đúng số slot dư (= requested)
 */
export async function allocateSlots(
  slotsNeeded: number,
  productId?: string,
): Promise<SlotAllocation | null> {
  if (slotsNeeded < 1 || slotsNeeded > 4) return null

  const pool = await loadPool(productId)
  const candidates = pool
    .filter((a) => freeSlotsAccount(a) >= slotsNeeded)
    .sort((a, b) => {
      const diffA = freeSlotsAccount(a) - slotsNeeded
      const diffB = freeSlotsAccount(b) - slotsNeeded
      if (diffA !== diffB) return diffA - diffB
      return a.slots_used - b.slots_used
    })

  const account = candidates[0]
  if (!account) return null

  const freeBefore = freeSlotsAccount(account)
  const startSlot = account.slots_used + 1
  const assignedSlots = account.slot_details.filter(
    (s) => s.slot_number >= startSlot && s.slot_number < startSlot + slotsNeeded,
  )

  const finalSlots =
    assignedSlots.length >= slotsNeeded
      ? assignedSlots.slice(0, slotsNeeded)
      : Array.from({ length: slotsNeeded }, (_, i) => ({
          slot_number: startSlot + i,
          profile_name: `Profile ${startSlot + i}`,
          pin: `${startSlot}${i}000`,
        }))

  const newUsed = account.slots_used + slotsNeeded
  account.slots_used = newUsed
  if (newUsed >= account.max_slots) account.status = 'full'

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient()
    await supabase
      .from('streaming_account_pool')
      .update({
        slots_used: newUsed,
        status: newUsed >= account.max_slots ? 'full' : 'active',
      })
      .eq('id', account.id)
  }

  return {
    poolAccountId: account.id,
    serviceEmail: account.service_email,
    servicePassword: account.service_password,
    slotsCount: slotsNeeded,
    assignedSlots: finalSlots,
    freeSlotsBefore: freeBefore,
  }
}

/** Luôn giữ ít nhất 1 account còn dư đúng 1, 2, 3, 4 slot */
export async function ensureMinimumPool(productId?: string | null) {
  const pool = await loadPool(productId || undefined)

  for (const spare of MIN_SPARE_TARGETS) {
    const hasTarget = pool.some((a) => freeSlotsAccount(a) === spare)
    if (!hasTarget) {
      await createPoolAccount(spare, productId || undefined)
      pool.push(...(await loadPool(productId || undefined)))
    }
  }
}

async function createPoolAccount(freeSlotsTarget: number, productId?: string) {
  const max_slots = 4
  const slots_used = max_slots - freeSlotsTarget
  const rand = Math.random().toString(36).slice(2, 8)
  const row = {
    product_id: productId || '660e8400-e29b-41d4-a716-446655440003',
    service_email: `auto.pool.${freeSlotsTarget}free.${rand}@streamhub.app`,
    service_password: `Auto${rand}26!`,
    max_slots,
    slots_used,
    slot_details: defaultSlotDetails(max_slots),
    status: 'active',
    notes: `Auto-provisioned: ${freeSlotsTarget} spare slot(s)`,
  }

  if (!isSupabaseConfigured()) return

  const supabase = createAdminClient()
  await supabase.from('streaming_account_pool').insert(row)
}

export async function getPoolInventorySummary(productId?: string) {
  const pool = await loadPool(productId)
  const summary = {
    totalAccounts: pool.length,
    activeAccounts: pool.filter((a) => a.status === 'active').length,
    byFreeSlots: { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>,
    totalFreeSlots: 0,
  }

  for (const a of pool) {
    const free = freeSlotsAccount(a)
    summary.totalFreeSlots += free
    if (free >= 1 && free <= 4) summary.byFreeSlots[free]++
  }
  return summary
}

let localPoolCache: PoolAccount[] | null = null

function getLocalFallbackPool(): PoolAccount[] {
  if (localPoolCache) return localPoolCache.map((a) => ({ ...a, slot_details: [...a.slot_details] }))
  localPoolCache = [
    { id: 'local-4', product_id: null, service_email: 'local.4@streamhub.app', service_password: 'Local4!', max_slots: 4, slots_used: 0, slot_details: defaultSlotDetails(4), status: 'active' },
    { id: 'local-3', product_id: null, service_email: 'local.3@streamhub.app', service_password: 'Local3!', max_slots: 4, slots_used: 1, slot_details: defaultSlotDetails(4), status: 'active' },
    { id: 'local-2', product_id: null, service_email: 'local.2@streamhub.app', service_password: 'Local2!', max_slots: 4, slots_used: 2, slot_details: defaultSlotDetails(4), status: 'active' },
    { id: 'local-1', product_id: null, service_email: 'local.1@streamhub.app', service_password: 'Local1!', max_slots: 4, slots_used: 3, slot_details: defaultSlotDetails(4), status: 'active' },
  ]
  return localPoolCache.map((a) => ({ ...a, slot_details: [...a.slot_details] }))
}

export function calcPriceBySlots(basePrice: number, slots: number, planType: PlanType) {
  if (isShortTermPlan(planType)) {
    const dayMult = { daily_1: 0.2, daily_3: 0.45, daily_7: 0.85 } as const
    return Math.round(basePrice * dayMult[planType] * 100) / 100
  }
  const planMultipliers = { monthly: 1, quarterly: 2.8, annual: 10 }
  const s = Math.min(4, Math.max(1, slots))
  return Math.round(basePrice * s * planMultipliers[planType] * 100) / 100
}
