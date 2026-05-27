import { NextResponse } from 'next/server'
import { createAdminClient, createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import {
  buildSlotUsageForAccount,
  fetchActivePoolRentals,
  loadProductNames,
  type SlotDetail,
} from '@/lib/admin/pool-usage'
import { adminPoolCreateSchema, adminPoolQuerySchema } from '@/lib/validation/admin'
import { parseJsonBody } from '@/lib/validation/parse'

function supabaseAdmin() {
  return hasSupabaseServiceRole() ? createServiceRoleClient() : createAdminClient()
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return String((e as { message: unknown }).message)
  }
  return 'Error'
}

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

    const url = new URL(request.url)
    const queryParsed = adminPoolQuerySchema.safeParse({
      q: url.searchParams.get('q') || undefined,
      productId: url.searchParams.get('productId') || undefined,
      status: url.searchParams.get('status') || undefined,
    })
    const query = queryParsed.success ? queryParsed.data : {}

    const supabase = supabaseAdmin()
    let poolQuery = supabase.from('streaming_account_pool').select('*').order('created_at', {
      ascending: false,
    })

    if (query.productId) poolQuery = poolQuery.eq('product_id', query.productId)
    if (query.status) poolQuery = poolQuery.eq('status', query.status)
    if (query.q) {
      const term = query.q.replace(/[%_,]/g, '')
      if (term) {
        poolQuery = poolQuery.or(`service_email.ilike.%${term}%,notes.ilike.%${term}%`)
      }
    }

    const { data, error } = await poolQuery

    if (error) throw new Error(error.message)

    let rentals: Awaited<ReturnType<typeof fetchActivePoolRentals>> = []
    try {
      rentals = await fetchActivePoolRentals(supabase)
    } catch (rentalErr) {
      console.error('[admin/pool] rentals', rentalErr)
    }

    const productIds = [
      ...new Set((data || []).map((r) => r.product_id).filter((id): id is string => Boolean(id))),
    ]
    const productNames = await loadProductNames(supabase, productIds)

    const accounts = (data || []).map((row) => {
      const slotDetails = (Array.isArray(row.slot_details) ? row.slot_details : []) as SlotDetail[]
      const slot_usage = buildSlotUsageForAccount(slotDetails, rentals, row.id)
      return {
        ...row,
        product_name: row.product_id ? productNames[row.product_id] || null : null,
        slot_usage,
      }
    })

    return NextResponse.json({ accounts, rentals })
  } catch (e) {
    const msg = errorMessage(e)
    console.error('[admin/pool GET]', e)
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

    const supabase = supabaseAdmin()
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
    if (error) throw new Error(error.message)
    return NextResponse.json({ account: data })
  } catch (e) {
    const msg = errorMessage(e)
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
