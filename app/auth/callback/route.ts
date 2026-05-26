import { createClient } from '@/lib/supabase/server'
import { ensureUserFromOAuth } from '@/lib/auth/ensure-oauth-user'
import { isPaymentQueryCode } from '@/lib/auth/oauth-query'
import { signSession, setSessionOnResponse } from '@/lib/auth/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const oauthErr = searchParams.get('error')
  const next = safeNextPath(searchParams.get('next'))
  const origin = request.nextUrl.origin

  if (oauthErr) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_${oauthErr}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_missing_code`)
  }

  // Nhầm mã SePay NH... → quay lại trang thanh toán
  if (isPaymentQueryCode(code)) {
    return NextResponse.redirect(
      `${origin}/checkout/sepay?code=${encodeURIComponent(code.toUpperCase())}`,
    )
  }

  try {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('[auth/callback] exchange', exchangeError.message)
      return NextResponse.redirect(`${origin}/auth/login?error=oauth_exchange`)
    }

    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !authUser) {
      return NextResponse.redirect(`${origin}/auth/login?error=oauth_no_user`)
    }

    const appUser = await ensureUserFromOAuth({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    })

    const token = signSession({
      userId: appUser.id,
      email: appUser.email,
      role: appUser.role,
    })

    const res = NextResponse.redirect(`${origin}${next}`)
    setSessionOnResponse(res, token)

    try {
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }

    return res
  } catch (err) {
    console.error('[auth/callback]', err)
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
  }
}
