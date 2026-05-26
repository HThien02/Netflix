import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'

const FALLBACK_REASONS = [
  {
    id: 'local-1',
    code: 'payment_fraud',
    title_vi: 'Gian lận thanh toán',
    title_en: 'Payment fraud',
    description_vi: 'Phát hiện giao dịch không hợp lệ.',
    description_en: 'Invalid payment detected.',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'local-2',
    code: 'terms_violation',
    title_vi: 'Vi phạm điều khoản',
    title_en: 'Terms violation',
    description_vi: 'Vi phạm điều khoản dịch vụ.',
    description_en: 'Terms of service violation.',
    is_active: true,
    sort_order: 2,
  },
]

export async function GET(request: Request) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ reasons: FALLBACK_REASONS })
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ban_reasons')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return NextResponse.json({ reasons: data || [] })
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
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ban_reasons')
      .insert({
        code: body.code,
        title_vi: body.title_vi,
        title_en: body.title_en,
        description_vi: body.description_vi || null,
        description_en: body.description_en || null,
        is_active: body.is_active !== false,
        sort_order: Number(body.sort_order) || 0,
      })
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
