import type { Product } from '@/lib/types'
import { publicUrlForProductImage } from '@/lib/products/image-storage'

export const DEFAULT_MERCHANT_ID = 'merchant-1'

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=300&fit=crop'

export type DbProductRow = {
  id: string
  name: string
  description?: string | null
  name_en?: string | null
  description_en?: string | null
  price: number | string
  discount_percent?: number | string | null
  category?: string | null
  image_url?: string | null
  image_storage_path?: string | null
  image_updated_at?: string | null
  is_active?: boolean | null
  coming_soon?: boolean | null
  created_at?: string
  updated_at?: string
}

function resolveProductImage(row: DbProductRow): string {
  if (row.image_storage_path) {
    return publicUrlForProductImage(row.image_storage_path, row.image_updated_at)
  }
  if (row.image_url?.trim()) {
    return row.image_url.trim()
  }
  return DEFAULT_PRODUCT_IMAGE
}

export function mapDbProductToApp(row: DbProductRow): Product {
  const discount = Number(row.discount_percent) || 0
  return {
    id: row.id,
    merchantId: DEFAULT_MERCHANT_ID,
    name: row.name,
    description: row.description || '',
    nameEn: row.name_en || undefined,
    descriptionEn: row.description_en || undefined,
    image: resolveProductImage(row),
    imageStoragePath: row.image_storage_path || undefined,
    category: (row.category || 'streaming').toLowerCase(),
    basePrice: Number(row.price) || 0,
    discountPercentage: discount > 0 ? discount : undefined,
    active: row.is_active !== false,
    comingSoon: row.coming_soon === true,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  }
}

export function productToDbPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {
    name: String(body.name || '').trim(),
    name_en: body.name_en != null ? String(body.name_en).trim() : null,
    description: body.description != null ? String(body.description) : null,
    description_en: body.description_en != null ? String(body.description_en) : null,
    price: Number(body.price ?? body.basePrice) || 1000,
    discount_percent: Number(body.discount_percent ?? body.discountPercentage) || 0,
    category: String(body.category || 'Streaming'),
    is_active: body.is_active !== false && body.active !== false,
    coming_soon: body.coming_soon === true || body.comingSoon === true,
    max_screens: Number(body.max_screens) || 4,
    quality: body.quality != null ? String(body.quality) : '4K',
    duration_months: Number(body.duration_months) || 1,
  }

  if (body.image_url !== undefined || body.image !== undefined) {
    const raw = body.image_url ?? body.image
    payload.image_url = raw != null && String(raw).trim() ? String(raw).trim() : null
  }
  if (body.image_storage_path !== undefined) {
    payload.image_storage_path = body.image_storage_path
  }
  if (body.image_updated_at !== undefined) {
    payload.image_updated_at = body.image_updated_at
  }

  return payload
}
