import { getSiteUrl } from '@/lib/site'

/** Chuẩn hóa token từ URL/body (trim, decode) */
export function normalizeResetToken(raw: string): string {
  try {
    return decodeURIComponent(raw.trim())
  } catch {
    return raw.trim()
  }
}

export function buildPasswordResetUrl(token: string): string {
  const normalized = normalizeResetToken(token)
  return `${getSiteUrl()}/auth/reset-password/${normalized}`
}

export function isResetTokenExpired(expiresAt: string): boolean {
  const exp = new Date(expiresAt).getTime()
  if (!Number.isFinite(exp)) return true
  return exp <= Date.now()
}
