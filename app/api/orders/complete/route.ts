import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { completeOrderServer } from '@/lib/orders/complete-order'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { isDemoCheckoutAllowed } from '@/lib/payments/demo-checkout'
import {
  getSessionOrNull,
  guardApiRequest,
} from '@/lib/security/request-guard'
import type { Cart, Lang } from '@/lib/types'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request, {
    auth: 'session',
    skipRateLimit: true,
  })
  if (denied) return denied

  const session = getSessionOrNull(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    if (userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (process.env.NODE_ENV === 'production' && !isDemoCheckoutAllowed()) {
      return NextResponse.json(
        {
          error:
            'Orders can only be completed through verified payment (PayOS / SePay).',
        },
        { status: 403 },
      )
    }

    if (!cart?.items?.length) {
      return NextResponse.json({ error: 'Missing cart' }, { status: 400 })
    }

    let email = userEmail || session.email
    let name = userName || 'Customer'
    const lang = (language === 'en' ? 'en' : 'vi') as Lang

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name, language')
        .eq('id', session.userId)
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
      userId: session.userId,
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
