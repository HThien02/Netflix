import type { NextResponse } from 'next/server'
import type { Cart, Lang } from '@/lib/types'

export const SEPAY_PENDING_COOKIE = 'nh_sepay_checkout'

export type SepayPendingPayload = {
  paymentCode: string
  userId: string
  cart: Cart
  productNames: Record<string, string>
  language: Lang
}

export function setSepayPendingCookie(res: NextResponse, payload: SepayPendingPayload) {
  res.cookies.set(SEPAY_PENDING_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })
}

export function readSepayPendingCookie(request: Request): SepayPendingPayload | null {
  const raw =
    'cookies' in request && typeof request.cookies?.get === 'function'
      ? request.cookies.get(SEPAY_PENDING_COOKIE)?.value
      : undefined

  if (!raw) {
    const header = request.headers.get('cookie')
    if (!header) return null
    const match = header.match(new RegExp(`${SEPAY_PENDING_COOKIE}=([^;]+)`))
    if (!match?.[1]) return null
    try {
      return JSON.parse(decodeURIComponent(match[1])) as SepayPendingPayload
    } catch {
      return null
    }
  }

  try {
    return JSON.parse(decodeURIComponent(raw)) as SepayPendingPayload
  } catch {
    return null
  }
}

export function clearSepayPendingCookie(res: NextResponse) {
  res.cookies.set(SEPAY_PENDING_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
