import { NextResponse } from 'next/server'
import { signSession, setSessionOnResponse } from '@/lib/auth/session-cookie'
import { guardApiRequest } from '@/lib/security/request-guard'
import { createLoginBodySchema } from '@/lib/validation/auth'
import { validationErrorResponse } from '@/lib/validation/parse'
import { validationMsg } from '@/lib/validation/messages'
import type { Lang } from '@/lib/translations'
import { withConstantLoginTiming } from '@/lib/auth/login-timing'
import { authenticateLoginSafe } from '@/lib/auth/authenticate-login'

function parseLang(raw: unknown): Lang {
  return raw === 'en' ? 'en' : 'vi'
}

export async function POST(request: Request) {
  const denied = await guardApiRequest(request, { skipOriginCheck: false })
  if (denied) return denied

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: validationMsg('vi', 'invalidJson') }, { status: 400 })
  }

  const lang = parseLang(
    typeof raw === 'object' && raw !== null && 'language' in raw
      ? (raw as { language?: string }).language
      : undefined,
  )

  const parsed = createLoginBodySchema(lang).safeParse(raw)
  if (!parsed.success) {
    return validationErrorResponse(parsed.error, lang)
  }

  try {
    const { email, password } = parsed.data

    const { user, source } = await withConstantLoginTiming(() =>
      authenticateLoginSafe(email, password),
    )

    if (!user || !source) {
      return NextResponse.json(
        { error: validationMsg(lang, 'invalidLogin') },
        { status: 401 },
      )
    }

    const token = signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        language: user.language,
        avatar: user.avatar,
      },
      source,
    })

    return setSessionOnResponse(res, token)
  } catch {
    return NextResponse.json({ error: validationMsg(lang, 'serverError') }, { status: 500 })
  }
}
