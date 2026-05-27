import { calcPriceBySlots } from '@/lib/inventory/pool'
import { isProductPurchasable } from '@/lib/products/catalog'
import { calculateDiscount } from '@/lib/utils/format'
import type { Product } from '@/lib/types'

export function getProductFromPrice(product: Product, slots = 1): number {
  const base = product.discountPercentage
    ? calculateDiscount(product.basePrice, product.discountPercentage)
    : product.basePrice
  return calcPriceBySlots(base, slots, 'monthly')
}

/** Giá thấp nhất trên marketplace (1 slot, gói tháng) — dùng hero home. */
export function getCheapestPurchasablePrice(products: Product[]): number | null {
  let min: number | null = null
  for (const product of products) {
    if (!isProductPurchasable(product)) continue
    const price = getProductFromPrice(product)
    if (min === null || price < min) min = price
  }
  return min
}
