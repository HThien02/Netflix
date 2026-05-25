import { getSiteUrl } from '@/lib/site'

/** URL webhook PayOS có thể gọi được từ internet (không dùng localhost) */
export function resolvePayosWebhookUrl(override?: string): string {
  const explicit = override || process.env.PAYOS_WEBHOOK_URL
  if (explicit) return explicit.replace(/\/$/, '')

  return `${getSiteUrl()}/api/payments/payos/webhook`
}

export function isPublicPayosWebhookUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local')
  } catch {
    return false
  }
}
