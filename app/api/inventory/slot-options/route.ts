import { NextResponse } from 'next/server'
import { getAvailableSlotOptions } from '@/lib/inventory/pool'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') || undefined
    const options = await getAvailableSlotOptions(productId)
    return NextResponse.json({ options })
  } catch {
    return NextResponse.json({ options: [1, 2, 3, 4] })
  }
}
