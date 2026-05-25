import { NextResponse } from 'next/server'
import {
  getPaymentByOrderCode,
  isPayosConfigured,
  isPayosPaymentPaid,
} from '@/lib/payos/client'

export async function GET(request: Request) {
  const orderCode = Number(new URL(request.url).searchParams.get('orderCode'))
  if (!orderCode) {
    return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 })
  }

  if (!isPayosConfigured()) {
    return NextResponse.json({ paid: true, demo: true })
  }

  const data = await getPaymentByOrderCode(orderCode)
  const paid = isPayosPaymentPaid(data)

  if (!paid) {
    return NextResponse.json(
      {
        paid: false,
        error: 'Payment not completed',
        status: data?.status,
        amount: data?.amount,
        amountPaid: data?.amountPaid,
        amountRemaining: data?.amountRemaining,
      },
      { status: 402 },
    )
  }

  return NextResponse.json({
    paid: true,
    status: data?.status,
    amount: data?.amount,
    amountPaid: data?.amountPaid,
  })
}
