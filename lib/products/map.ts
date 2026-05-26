import type { Product } from '@/lib/types'

export const DEFAULT_MERCHANT_ID = 'merchant-1'

const DEFAULT_IMAGE =
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
  is_active?: boolean | null
  coming_soon?: boolean | null
  created_at?: string
  updated_at?: string
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
    image: row.image_url || DEFAULT_IMAGE,
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
  return {
    name: String(body.name || '').trim(),
    name_en: body.name_en != null ? String(body.name_en).trim() : null,
    description: body.description != null ? String(body.description) : null,
    description_en: body.description_en != null ? String(body.description_en) : null,
    price: Number(body.price ?? body.basePrice) || 1000,
    discount_percent: Number(body.discount_percent ?? body.discountPercentage) || 0,
    category: String(body.category || 'Streaming'),
    image_url: body.image_url != null ? String(body.image_url) : body.image != null ? String(body.image) : null,
    is_active: body.is_active !== false && body.active !== false,
    coming_soon: body.coming_soon === true || body.comingSoon === true,
    max_screens: Number(body.max_screens) || 4,
    quality: body.quality != null ? String(body.quality) : '4K',
    duration_months: Number(body.duration_months) || 1,
  }
}
