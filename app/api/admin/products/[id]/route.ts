import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { mapDbProductToApp, productToDbPayload } from '@/lib/products/map'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    await requireAdminUser(body.adminUserId)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase required' }, { status: 400 })
    }

    const payload = productToDbPayload(body)
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ product: mapDbProductToApp(data) })
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
    const adminUserId =
      request.headers.get('x-admin-user-id') ||
      new URL(request.url).searchParams.get('adminUserId')
    await requireAdminUser(adminUserId)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { count } = await supabase
      .from('purchased_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)
      .eq('status', 'active')

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete: active rentals exist for this product' },
        { status: 409 },
      )
    }

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
