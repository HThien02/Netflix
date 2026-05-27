import { NextResponse } from 'next/server'
import { createAdminClient, createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'

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
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    await requireAdminUser(body.adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (body.service_email != null) updates.service_email = body.service_email
    if (body.service_password != null) updates.service_password = body.service_password
    if (body.max_slots != null) updates.max_slots = body.max_slots
    if (body.slots_used != null) updates.slots_used = body.slots_used
    if (body.slot_details != null) updates.slot_details = body.slot_details
    if (body.status != null) updates.status = body.status
    if (body.notes != null) updates.notes = body.notes
    if (body.product_id !== undefined) updates.product_id = body.product_id

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('streaming_account_pool')
      .update(updates)
      .eq('id', id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const adminUserId = request.headers.get('x-admin-user-id')
      || new URL(request.url).searchParams.get('adminUserId')
    await requireAdminUser(adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase required' }, { status: 400 })
    }
    const supabase = supabaseAdmin()
    const { error } = await supabase.from('streaming_account_pool').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = errorMessage(e)
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
