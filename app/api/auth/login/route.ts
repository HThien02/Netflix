import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth/session'
import { signSession, setSessionOnResponse } from '@/lib/auth/session-cookie'
import { guardApiRequest } from '@/lib/security/request-guard'
import { loginBodySchema } from '@/lib/validation/auth'
import { parseJsonBody } from '@/lib/validation/parse'

export async function POST(request: Request) {
  const denied = await guardApiRequest(request, { skipOriginCheck: false })
  if (denied) return denied

  const parsed = await parseJsonBody(request, loginBodySchema)
  if (!parsed.ok) return parsed.response

  try {
    const { email, password } = parsed.data

    const { user, source } = await authenticateUser(email, password)
    if (!user || !source) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
