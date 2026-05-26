export const SUPPORT_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png'])
export const SUPPORT_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png'])
export const SUPPORT_MAX_FILE_BYTES = 5 * 1024 * 1024
export const SUPPORT_MAX_FILES = 5

export type SupportAttachmentMeta = {
  url: string
  name: string
  mimeType: string
  size: number
}

export function isAllowedSupportImage(file: File): boolean {
  const mime = file.type.toLowerCase()
  if (SUPPORT_IMAGE_MIME.has(mime)) return true
  const ext = file.name.split('.').pop()?.toLowerCase()
  return Boolean(ext && SUPPORT_IMAGE_EXT.has(ext))
}

export function validateSupportImageFiles(files: File[]): string | null {
  if (files.length > SUPPORT_MAX_FILES) {
    return `Tối đa ${SUPPORT_MAX_FILES} ảnh`
  }
  for (const file of files) {
    if (!isAllowedSupportImage(file)) {
      return 'Chỉ chấp nhận ảnh JPG, JPEG hoặc PNG'
    }
    if (file.size > SUPPORT_MAX_FILE_BYTES) {
      return 'Mỗi ảnh tối đa 5MB'
    }
  }
  return null
}
