import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendForgotPasswordEmail } from '@/lib/email/send'
import { getSiteUrl } from '@/lib/site'
import { guardApiRequest } from '@/lib/security/request-guard'
import { forgotPasswordBodySchema } from '@/lib/validation/auth'
import { parseJsonBody } from '@/lib/validation/parse'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request)
  if (denied) return denied

  const parsed = await parseJsonBody(request, forgotPasswordBodySchema)
  if (!parsed.ok) return parsed.response

  try {
    const { email, language } = parsed.data
    const normalized = email

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, language')
      .eq('email', normalized)
      .maybeSingle()

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })

      const lang = (language === 'en' ? 'en' : user.language) as 'vi' | 'en'
      const base = getSiteUrl()
      const resetUrl = `${base}/auth/reset-password?token=${token}`

      await sendForgotPasswordEmail(user.email, user.full_name, resetUrl, lang)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
