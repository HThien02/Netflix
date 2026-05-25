import { NextResponse } from 'next/server'
import { clearSessionOnResponse } from '@/lib/auth/session-cookie'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  return clearSessionOnResponse(res)
}
