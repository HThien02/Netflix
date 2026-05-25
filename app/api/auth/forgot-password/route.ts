import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendForgotPasswordEmail } from '@/lib/email/send'

export async function POST(request: Request) {
  try {
    const { email, language = 'vi' } = await request.json()
    const normalized = email?.toLowerCase()?.trim()
    if (!normalized?.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, language')
      .eq('email', normalized)
      .maybeSingle()

    // Luôn trả success để không lộ email có tồn tại hay không
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })

      const lang = (language === 'en' ? 'en' : user.language) as 'vi' | 'en'
      const base = process.env.APP_URL || 'http://localhost:3000'
      const resetUrl = `${base}/auth/reset-password?token=${token}`

      await sendForgotPasswordEmail(user.email, user.full_name, resetUrl, lang)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
