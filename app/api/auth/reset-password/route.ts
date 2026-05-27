import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { guardApiRequest } from '@/lib/security/request-guard'
import { resetPasswordBodySchema } from '@/lib/validation/auth'
import { parseJsonBody } from '@/lib/validation/parse'
import { isResetTokenExpired, normalizeResetToken } from '@/lib/auth/password-reset'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request)
  if (denied) return denied

  const parsed = await parseJsonBody(request, resetPasswordBodySchema)
  if (!parsed.ok) return parsed.response

  const { token: rawToken, password, language } = parsed.data
  const token = normalizeResetToken(rawToken)

  if (!hasSupabaseServiceRole()) {
    console.error('[reset-password] Missing SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: 'Server error' }, { status: 503 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: row, error: lookupError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (lookupError) {
      console.error('[reset-password] lookup failed', lookupError)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    if (!row || row.used_at || isResetTokenExpired(row.expires_at)) {
      return NextResponse.json(
        {
          error:
            language === 'vi' ? 'Link không hợp lệ hoặc đã hết hạn' : 'Invalid or expired link',
        },
        { status: 400 },
      )
    }

    const password_hash = await bcrypt.hash(password, 10)
    const { error: userError } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', row.user_id)

    if (userError) {
      console.error('[reset-password] update user failed', userError)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    const { error: markError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id)

    if (markError) {
      console.error('[reset-password] mark used failed', markError)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
