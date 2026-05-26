import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clearSessionOnResponse } from '@/lib/auth/session-cookie'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    /* Supabase auth optional */
  }

  const res = NextResponse.json({ ok: true })
  return clearSessionOnResponse(res)
}
