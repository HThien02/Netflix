import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/send'
import { signSession, setSessionOnResponse } from '@/lib/auth/session-cookie'
import { guardApiRequest } from '@/lib/security/request-guard'
import { registerBodySchema } from '@/lib/validation/auth'
import { parseJsonBody } from '@/lib/validation/parse'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request)
  if (denied) return denied

  const parsed = await parseJsonBody(request, registerBodySchema)
  if (!parsed.ok) return parsed.response

  try {
    const { email, password, fullName, language } = parsed.data

    const supabase = createAdminClient()
    const normalized = email

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalized)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: normalized,
        password_hash,
        full_name: fullName,
        role: 'customer',
        language,
      })
      .select('id, email, full_name, role, language')
      .single()

    if (error || !user) {
      return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: 400 })
    }

    try {
      await sendWelcomeEmail(user.email, user.full_name, language)
    } catch {
      /* email optional */
    }

    const token = signSession({
      userId: user.id,
      email: user.email,
      role: user.role as 'customer',
    })

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        language: user.language,
      },
    })
    return setSessionOnResponse(res, token)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
