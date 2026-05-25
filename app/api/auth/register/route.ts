import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/send'
import { signSession, setSessionOnResponse } from '@/lib/auth/session-cookie'

export async function POST(request: Request) {
  try {
    const { email, password, fullName, language = 'vi' } = await request.json()
    if (!email?.includes('@') || !password || password.length < 6 || !fullName?.trim()) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const normalized = email.toLowerCase().trim()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalized)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: language === 'vi' ? 'Email đã được sử dụng' : 'Email already in use' },
        { status: 409 },
      )
    }

    const password_hash = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: normalized,
        password_hash,
        role: 'customer',
        full_name: fullName.trim(),
        language: language === 'en' ? 'en' : 'vi',
      })
      .select('id, email, full_name, role, language')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await sendWelcomeEmail(normalized, fullName.trim(), language === 'en' ? 'en' : 'vi')

    const token = signSession({
      userId: user.id,
      email: user.email,
      role: user.role as 'customer' | 'merchant' | 'admin',
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
