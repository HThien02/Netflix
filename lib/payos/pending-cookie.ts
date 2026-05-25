import type { NextResponse } from 'next/server'
import type { Cart, Lang } from '@/lib/types'

export const PAYOS_PENDING_COOKIE = 'nh_payos_checkout'

export type PayosPendingPayload = {
  orderCode: number
  userId: string
  cart: Cart
  productNames: Record<string, string>
  language: Lang
}

export function setPayosPendingCookie(res: NextResponse, payload: PayosPendingPayload) {
  res.cookies.set(PAYOS_PENDING_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })
}

export function readPayosPendingCookie(request: Request): PayosPendingPayload | null {
  const raw =
    'cookies' in request && typeof request.cookies?.get === 'function'
      ? request.cookies.get(PAYOS_PENDING_COOKIE)?.value
      : undefined

  if (!raw) {
    const header = request.headers.get('cookie')
    if (!header) return null
    const match = header.match(new RegExp(`${PAYOS_PENDING_COOKIE}=([^;]+)`))
    if (!match?.[1]) return null
    try {
      return JSON.parse(decodeURIComponent(match[1])) as PayosPendingPayload
    } catch {
      return null
    }
  }

  try {
    return JSON.parse(decodeURIComponent(raw)) as PayosPendingPayload
  } catch {
    return null
  }
}

export function clearPayosPendingCookie(res: NextResponse) {
  res.cookies.set(PAYOS_PENDING_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
