import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

export async function GET(request: Request) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ rentals: [] })
    }
    const supabase = createAdminClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'active'
    const productId = url.searchParams.get('productId')

    let q = supabase
      .from('purchased_accounts')
      .select(
        `*, users ( id, email, full_name, language ),
         products ( id, name ),
         ban_reasons ( title_vi, title_en, code )`,
      )
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (productId) q = q.eq('product_id', productId)

    const { data, error } = await q
    if (error) throw error
    return NextResponse.json({ rentals: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
