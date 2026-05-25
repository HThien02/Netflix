import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { banPurchasedAccount } from '@/lib/admin/ban-rental'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    await requireAdminUser(body.adminUserId)
    await banPurchasedAccount({
      rentalId: id,
      adminUserId: body.adminUserId,
      banReasonId: body.banReasonId,
      adminNote: body.adminNote,
    })
    return NextResponse.json({ ok: true })
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
