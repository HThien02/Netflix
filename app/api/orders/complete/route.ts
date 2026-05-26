import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { completeOrderServer } from '@/lib/orders/complete-order'
import { isSupabaseConfigured } from '@/lib/auth/login'
import type { Cart, Lang } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      userEmail,
      userName,
      language = 'vi',
      cart,
      productNames,
      paymentMethod,
    } = body as {
      userId: string
      userEmail?: string
      userName?: string
      language?: Lang
      cart: Cart
      productNames: Record<string, string>
      paymentMethod: 'payos' | 'sepay' | 'credit_card' | 'wallet'
    }

    if (!userId || !cart?.items?.length) {
      return NextResponse.json({ error: 'Missing cart or user' }, { status: 400 })
    }

    let email = userEmail || ''
    let name = userName || 'Customer'
    const lang = (language === 'en' ? 'en' : 'vi') as Lang

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name, language')
        .eq('id', userId)
        .single()
      if (user) {
        email = user.email || email
        name = user.full_name || name
      }
    }

    if (!email) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    const result = await completeOrderServer({
      userId,
      userEmail: email,
      userName: name,
      language: lang,
      cart,
      productNames,
      paymentMethod: paymentMethod || 'payos',
    })

    return NextResponse.json({
      ...result,
      savedToDb: isSupabaseConfigured(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
