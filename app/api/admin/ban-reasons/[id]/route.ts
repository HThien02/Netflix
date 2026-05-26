import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    for (const key of [
      'code',
      'title_vi',
      'title_en',
      'description_vi',
      'description_en',
      'is_active',
      'sort_order',
    ]) {
      if (body[key] !== undefined) updates[key] = body[key]
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ban_reasons')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ reason: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
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
    await requireAdminUser(adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase required' }, { status: 400 })
    }
    const supabase = createAdminClient()
    const { error } = await supabase.from('ban_reasons').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
