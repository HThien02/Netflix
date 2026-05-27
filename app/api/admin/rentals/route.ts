import { NextResponse } from 'next/server'
import { createAdminClient, createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { purchasedAccountUserEmbed } from '@/lib/supabase/embeds'

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

export async function GET(request: Request) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminUserId, request)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ rentals: [] })
    }

    const supabase = supabaseAdmin()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'active'
    const productId = url.searchParams.get('productId')
    const includeExpired = url.searchParams.get('includeExpired') === '1'

    let q = supabase
      .from('purchased_accounts')
      .select(
        `id, user_id, product_id, product_name, plan_type, service_email,
         profile_name, slots_count, pool_account_id, slot_assignments,
         expires_at, status, created_at,
         ${purchasedAccountUserEmbed} ( id, email, full_name, language )`,
      )
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (!includeExpired && status === 'active') {
      q = q.gt('expires_at', new Date().toISOString())
    }

    if (productId) q = q.eq('product_id', productId)

    const { data, error } = await q
    if (error) throw new Error(error.message)

    return NextResponse.json({ rentals: data || [] })
  } catch (e) {
    const msg = errorMessage(e)
    console.error('[admin/rentals GET]', e)
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
