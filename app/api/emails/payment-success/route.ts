import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentSuccessEmail } from '@/lib/email/send'
import { formatCurrency } from '@/lib/utils/format'
import {
  getSessionOrNull,
  guardApiRequest,
} from '@/lib/security/request-guard'
import { verifyCronSecret } from '@/lib/security/api-auth'

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    const denied = await guardApiRequest(request, { auth: 'admin' })
    if (denied) return denied
    const session = getSessionOrNull(request)
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const { userId, invoiceNumber, total, productNames, language = 'vi' } =
      await request.json()

    if (!userId || !invoiceNumber) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name, language')
      .eq('id', userId)
      .single()

    if (!user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const lang = (language === 'en' ? 'en' : user.language || 'vi') as 'vi' | 'en'
    await sendPaymentSuccessEmail(
      user.email,
      user.full_name,
      lang,
      invoiceNumber,
      formatCurrency(total),
      productNames,
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Email failed' },
      { status: 500 },
    )
  }
}
