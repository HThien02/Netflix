import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import {
  buildSlotUsageForAccount,
  fetchActivePoolRentals,
  type SlotDetail,
} from '@/lib/admin/pool-usage'
import { adminPoolCreateSchema } from '@/lib/validation/admin'
import { parseJsonBody } from '@/lib/validation/parse'

function defaultSlots(max: number) {
  return Array.from({ length: max }, (_, i) => ({
    slot_number: i + 1,
    profile_name: `Profile ${i + 1}`,
    pin: `${1000 + i}`,
  }))
}

export async function GET(request: Request) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ accounts: [] })
    }
    const supabase = createAdminClient()
    const [{ data, error }, rentals] = await Promise.all([
      supabase
        .from('streaming_account_pool')
        .select('*, products(id, name)')
        .order('created_at', { ascending: false }),
      fetchActivePoolRentals(supabase),
    ])
    if (error) throw error

    const accounts = (data || []).map((row) => {
      const slotDetails = (Array.isArray(row.slot_details) ? row.slot_details : []) as SlotDetail[]
      const slot_usage = buildSlotUsageForAccount(slotDetails, rentals, row.id)
      const prod = row.products as { id?: string; name?: string } | null
      return {
        ...row,
        product_name: prod?.name || null,
        slot_usage,
      }
    })

    return NextResponse.json({ accounts, rentals })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, adminPoolCreateSchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data
    await requireAdminUser(body.adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase required' }, { status: 400 })
    }
    const max_slots = Math.min(4, Math.max(1, Number(body.max_slots) || 4))
    const slots_used = Math.min(max_slots, Math.max(0, Number(body.slots_used) || 0))
    const slot_details = Array.isArray(body.slot_details) && body.slot_details.length
      ? body.slot_details
      : defaultSlots(max_slots)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('streaming_account_pool')
      .insert({
        product_id: body.product_id || null,
        service_email: body.service_email,
        service_password: body.service_password,
        max_slots,
        slots_used,
        slot_details,
        status: body.status || 'active',
        notes: body.notes || null,
      })
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ account: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
