import { NextResponse } from 'next/server'
import { getAvailableSlotOptions } from '@/lib/inventory/pool'
import { productIdSchema } from '@/lib/validation/fields'
import { parseQuery } from '@/lib/validation/parse'
import { z } from 'zod'

const slotOptionsQuerySchema = z.object({
  productId: productIdSchema.optional(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = parseQuery(url.searchParams, slotOptionsQuerySchema)
  if (!query.ok) return query.response

  try {
    const options = await getAvailableSlotOptions(query.data.productId)
    return NextResponse.json({ options })
  } catch {
    return NextResponse.json({ options: [1, 2, 3, 4] })
  }
}
