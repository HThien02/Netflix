import type { Lang } from '@/lib/translations'

/** Luôn hiển thị VND (cả khi UI tiếng Anh) */
export function formatCurrency(amount: number): string {
  const value = Math.round(amount)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** @deprecated Dùng formatCurrency — mọi giá đều VND */
export const formatVNDCurrency = formatCurrency

function dateLocale(lang: Lang = 'vi') {
  return lang === 'vi' ? 'vi-VN' : 'en-US'
}

export function formatDate(date: Date | string, lang: Lang = 'vi'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(dateLocale(lang), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** @deprecated Dùng formatDate(date, lang) */
export function formatVNDate(date: Date | string): string {
  return formatDate(date, 'vi')
}

export function formatDateTime(date: Date | string, lang: Lang = 'vi'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(dateLocale(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** @deprecated Dùng formatDateTime(date, lang) */
export function formatVNDateTime(date: Date | string): string {
  return formatDateTime(date, 'vi')
}

export function formatTimeAgo(date: Date | string, lang: Lang = 'vi'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) {
    return lang === 'vi' ? 'vừa xong' : 'just now'
  }
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    return lang === 'vi' ? `${m} phút trước` : `${m}m ago`
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    return lang === 'vi' ? `${h} giờ trước` : `${h}h ago`
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400)
    return lang === 'vi' ? `${days} ngày trước` : `${days}d ago`
  }

  return formatDate(d, lang)
}

/** "Profile 4" → "Hồ sơ 4" khi chọn tiếng Việt */
export function formatProfileName(name: string | undefined | null, lang: Lang = 'vi'): string {
  if (!name?.trim()) return '—'
  const m = name.trim().match(/^Profile\s*(\d+)$/i)
  if (m) return lang === 'vi' ? `Hồ sơ ${m[1]}` : `Profile ${m[1]}`
  return name.trim()
}

export function formatSlotAssignmentLine(
  slot: { slot_number: number; profile_name: string; pin?: string },
  lang: Lang = 'vi',
): string {
  const profile = formatProfileName(slot.profile_name, lang)
  const pin = slot.pin
    ? lang === 'vi'
      ? ` · Mã PIN: ${slot.pin}`
      : ` · PIN: ${slot.pin}`
    : ''
  const slotLabel = lang === 'vi' ? 'Slot' : 'Slot'
  return `${slotLabel} ${slot.slot_number}: ${profile}${pin}`
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function calculateDiscount(originalPrice: number, discountPercentage: number): number {
  return originalPrice - (originalPrice * discountPercentage) / 100
}

export function calculateTax(amount: number, taxRate: number = 0.1): number {
  return amount * taxRate
}

export function calculateTotal(amount: number, taxRate: number = 0.1): number {
  const tax = calculateTax(amount, taxRate)
  return amount + tax
}
