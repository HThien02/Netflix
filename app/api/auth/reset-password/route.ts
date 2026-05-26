import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardApiRequest } from '@/lib/security/request-guard'
import { resetPasswordBodySchema } from '@/lib/validation/auth'
import { parseJsonBody } from '@/lib/validation/parse'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request)
  if (denied) return denied

  const parsed = await parseJsonBody(request, resetPasswordBodySchema)
  if (!parsed.ok) return parsed.response

  try {
    const { token, password, language } = parsed.data

    const supabase = createAdminClient()
    const { data: row } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
      return NextResponse.json(
        {
          error:
            language === 'vi' ? 'Link không hợp lệ hoặc đã hết hạn' : 'Invalid or expired link',
        },
        { status: 400 },
      )
    }

    const password_hash = await bcrypt.hash(password, 10)
    await supabase.from('users').update({ password_hash }).eq('id', row.user_id)
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
