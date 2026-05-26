import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import { getUserSepayTransactionReport } from '@/lib/sepay/user-transactions'

export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get('days')) || 90))
  const report = await getUserSepayTransactionReport(session.userId, days)

  return NextResponse.json({
    days,
    ...report,
  })
}
