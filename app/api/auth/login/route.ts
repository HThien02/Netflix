import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth/session'
import { signSession, setSessionOnResponse } from '@/lib/auth/session-cookie'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

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
