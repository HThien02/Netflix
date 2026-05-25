import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentSuccessEmail } from '@/lib/email/send'
import { formatCurrency } from '@/lib/utils/format'

export async function POST(request: Request) {
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
      formatCurrency(Number(total) || 0),
      productNames || [],
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
