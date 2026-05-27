import { createServiceRoleClient } from '@/lib/supabase/admin'

export const PRODUCT_IMAGE_BUCKET = 'product-images'
const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export function validateProductImageFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return 'Chỉ chấp nhận JPG, PNG hoặc WebP'
  }
  if (file.size > MAX_BYTES) {
    return 'Ảnh tối đa 2MB'
  }
  return null
}

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

export function productImageObjectPath(productId: string, mime: string): string {
  return `${productId}/cover.${extFromMime(mime)}`
}

export function publicUrlForProductImage(path: string, updatedAt?: string | Date | null): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!supabaseUrl) return ''
  const base = `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`
  if (!updatedAt) return base
  const v = typeof updatedAt === 'string' ? new Date(updatedAt).getTime() : updatedAt.getTime()
  return `${base}?v=${v}`
}

export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<{ path: string; publicUrl: string }> {
  const err = validateProductImageFile(file)
  if (err) throw new Error(err)

  const supabase = createServiceRoleClient()
  const path = productImageObjectPath(productId, file.type || 'image/jpeg')
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, buffer, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
    cacheControl: '31536000',
  })

  if (error) {
    console.error('[product-image] upload failed', path, error.message)
    throw new Error('Không tải được ảnh lên')
  }

  const updatedAt = new Date().toISOString()
  return { path, publicUrl: publicUrlForProductImage(path, updatedAt) }
}

export async function removeProductImageFromStorage(path: string | null | undefined): Promise<void> {
  if (!path?.trim()) return
  const supabase = createServiceRoleClient()
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path])
  if (error) {
    console.error('[product-image] remove failed', path, error.message)
  }
}
