import { NextResponse } from 'next/server'
import { banPoolAccount } from '@/lib/admin/ban-pool-account'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { adminPoolBanSchema } from '@/lib/validation/admin'
import { parseJsonBody } from '@/lib/validation/parse'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: poolAccountId } = await params
    const parsed = await parseJsonBody(request, adminPoolBanSchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data
    await requireAdminUser(body.adminUserId, request)

    const result = await banPoolAccount({
      poolAccountId,
      adminUserId: body.adminUserId!,
      banReasonId: body.banReasonId,
      adminNote: body.adminNote ?? undefined,
      rentalId: body.rentalId ?? undefined,
      disablePool: body.disablePool,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status =
      msg === 'Unauthorized' || msg === 'Forbidden'
        ? 403
        : msg.includes('not found')
          ? 404
          : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
