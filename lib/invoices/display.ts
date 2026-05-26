import { t, type Lang } from '@/lib/translations'

export function invoiceStatusLabel(status: string, lang: Lang): string {
  const key = `invoice.status.${status}` as const
  const label = t(key, lang)
  return label === key ? status : label
}
