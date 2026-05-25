import { NextResponse } from 'next/server'
import { ensureMinimumPool, getPoolInventorySummary } from '@/lib/inventory/pool'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureMinimumPool()
  const summary = await getPoolInventorySummary()
  return NextResponse.json({ ok: true, summary })
}
