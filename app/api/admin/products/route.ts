import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { mapDbProductToApp, productToDbPayload } from '@/lib/products/map'

export async function GET(request: Request) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ products: [], error: 'Supabase required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const products = (data || []).map(mapDbProductToApp)
    const { data: poolCounts } = await supabase
      .from('streaming_account_pool')
      .select('product_id')

    const countByProduct: Record<string, number> = {}
    for (const row of poolCounts || []) {
      if (row.product_id) {
        countByProduct[row.product_id] = (countByProduct[row.product_id] || 0) + 1
      }
    }

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        poolAccountCount: countByProduct[p.id] || 0,
      })),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await requireAdminUser(body.adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase required' }, { status: 400 })
    }

    const payload = productToDbPayload(body)
    if (!payload.name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('products').insert(payload).select('*').single()
    if (error) throw error

    return NextResponse.json({ product: mapDbProductToApp(data) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
