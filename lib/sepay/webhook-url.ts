import { getSiteUrl } from '@/lib/site'

export function resolveSepayWebhookUrl(override?: string): string {
  const explicit = override || process.env.SEPAY_WEBHOOK_URL
  if (explicit) return explicit.replace(/\/$/, '')
  return `${getSiteUrl()}/api/payments/sepay/webhook`
}

export function isPublicSepayWebhookUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local')
  } catch {
    return false
  }
}
