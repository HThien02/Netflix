/** Domain production — dùng làm mặc định khi không set APP_URL */
export const SITE_DOMAIN = 'www.netflixhub.com.vn'
export const SITE_NAME = 'NetflixHub'
export const DEFAULT_SITE_URL = `https://${SITE_DOMAIN}`

/** URL gốc app (PayOS return, email, webhook). Ưu tiên APP_URL trong .env */
export function getSiteUrl(): string {
  let raw = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!raw && process.env.VERCEL_URL) {
    raw = `https://${process.env.VERCEL_URL}`
  }
  if (!raw) raw = DEFAULT_SITE_URL
  return String(raw).replace(/\/$/, '')
}

export function getSiteOrigin(): URL {
  return new URL(getSiteUrl())
}
