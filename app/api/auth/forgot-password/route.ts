import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { sendForgotPasswordEmail } from '@/lib/email/send'
import { buildPasswordResetUrl } from '@/lib/auth/password-reset'
import { guardApiRequest } from '@/lib/security/request-guard'
import { forgotPasswordBodySchema } from '@/lib/validation/auth'
import { parseJsonBody } from '@/lib/validation/parse'
import { validationMsg } from '@/lib/validation/messages'
import type { Lang } from '@/lib/translations'

function resolveLang(requestLang: string | undefined, userLang: string | null | undefined): Lang {
  if (requestLang === 'en') return 'en'
  if (userLang === 'en') return 'en'
  return 'vi'
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes('password_reset_tokens') &&
    (message.includes('does not exist') || message.includes('42P01'))
  )
}

export async function POST(request: Request) {
  const denied = await guardApiRequest(request)
  if (denied) return denied

  const parsed = await parseJsonBody(request, forgotPasswordBodySchema)
  if (!parsed.ok) return parsed.response

  const { email, language: requestLang } = parsed.data
  const lang = requestLang === 'en' ? 'en' : 'vi'

  if (!hasSupabaseServiceRole()) {
    console.error('[forgot-password] Missing SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: validationMsg(lang, 'serverError') }, { status: 503 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, language')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('[forgot-password] user lookup failed', userError)
      return NextResponse.json({ error: validationMsg(lang, 'serverError') }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ ok: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { error: deleteError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .is('used_at', null)

    if (deleteError && !isMissingTableError(deleteError.message)) {
      console.error('[forgot-password] delete old tokens failed', deleteError)
    }

    const { error: insertError } = await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('[forgot-password] insert token failed', insertError)
      if (isMissingTableError(insertError.message)) {
        return NextResponse.json(
          {
            error:
              lang === 'vi'
                ? 'Hệ thống chưa cấu hình đặt lại mật khẩu. Liên hệ hỗ trợ.'
                : 'Password reset is not configured. Please contact support.',
            code: 'RESET_TABLE_MISSING',
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: validationMsg(lang, 'serverError') }, { status: 500 })
    }

    const mailLang = resolveLang(requestLang, user.language)
    const resetUrl = buildPasswordResetUrl(token)
    const displayName = user.full_name?.trim() || user.email.split('@')[0] || 'User'

    try {
      const mail = await sendForgotPasswordEmail(user.email, displayName, resetUrl, mailLang)
      if (!mail.ok) {
        console.error('[forgot-password] email not sent', mail)
      }
    } catch (mailErr) {
      console.error('[forgot-password] email threw', mailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: validationMsg(lang, 'serverError') }, { status: 500 })
  }
}
