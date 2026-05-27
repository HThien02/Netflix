import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { sendForgotPasswordEmail } from '@/lib/email/send'
import { buildPasswordResetUrl } from '@/lib/auth/password-reset'
import { guardApiRequest } from '@/lib/security/request-guard'
import { forgotPasswordBodySchema } from '@/lib/validation/auth'
import { parseJsonBody } from '@/lib/validation/parse'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request)
  if (denied) return denied

  const parsed = await parseJsonBody(request, forgotPasswordBodySchema)
  if (!parsed.ok) return parsed.response

  if (!hasSupabaseServiceRole()) {
    console.error('[forgot-password] Missing SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: 'Server error' }, { status: 503 })
  }

  try {
    const { email, language } = parsed.data

    const supabase = createServiceRoleClient()
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, language')
      .eq('email', email)
      .maybeSingle()

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', user.id)
        .is('used_at', null)

      const { error: insertError } = await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      })

      if (insertError) {
        console.error('[forgot-password] insert token failed', insertError)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
      }

      const lang = (language === 'en' ? 'en' : user.language) as 'vi' | 'en'
      const resetUrl = buildPasswordResetUrl(token)

      const mail = await sendForgotPasswordEmail(user.email, user.full_name, resetUrl, lang)
      if (!mail.ok && !('skipped' in mail && mail.skipped)) {
        console.error('[forgot-password] email send failed')
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
