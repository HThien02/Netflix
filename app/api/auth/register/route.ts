import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/send'
import { signSession, setSessionOnResponse } from '@/lib/auth/session-cookie'
import { guardApiRequest } from '@/lib/security/request-guard'
import { createRegisterBodySchema } from '@/lib/validation/auth'
import { validationErrorResponse } from '@/lib/validation/parse'
import { validationMsg } from '@/lib/validation/messages'
import type { Lang } from '@/lib/translations'

function parseLang(raw: unknown): Lang {
  return typeof raw === 'object' && raw !== null && 'language' in raw && (raw as { language?: string }).language === 'en'
    ? 'en'
    : 'vi'
}

export async function POST(request: Request) {
  const denied = await guardApiRequest(request)
  if (denied) return denied

  if (!hasSupabaseServiceRole()) {
    console.error('[register] Missing SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: validationMsg('vi', 'serverError') }, { status: 503 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: validationMsg('vi', 'invalidJson') }, { status: 400 })
  }

  const lang = parseLang(raw)
  const parsed = createRegisterBodySchema(lang).safeParse(raw)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error, lang)
  }

  try {
    const { email, password, fullName, language } = parsed.data
    const msgLang: Lang = language === 'en' ? 'en' : 'vi'

    const supabase = createServiceRoleClient()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: validationMsg(msgLang, 'emailAlreadyRegistered') },
        { status: 409 },
      )
    }

    const password_hash = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        full_name: fullName,
        role: 'customer',
        language: msgLang,
      })
      .select('id, email, full_name, role, language')
      .single()

    if (error || !user) {
      console.error('[register] insert failed', error)
      return NextResponse.json(
        { error: validationMsg(msgLang, 'registerFailed') },
        { status: 400 },
      )
    }

    try {
      await sendWelcomeEmail(user.email, user.full_name, msgLang)
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
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: validationMsg(lang, 'serverError') }, { status: 500 })
  }
}
