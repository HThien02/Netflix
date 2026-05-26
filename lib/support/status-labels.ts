import { t, type Lang } from '@/lib/translations'
import type { SupportTicket } from '@/lib/types'

export function supportStatusLabel(status: SupportTicket['status'], lang: Lang): string {
  const map: Record<SupportTicket['status'], string> = {
    open: 'support.statusOpen',
    in_progress: 'support.statusInProgress',
    resolved: 'support.statusResolved',
    closed: 'support.statusClosed',
  }
  const key = map[status]
  return t(key, lang)
}

export function supportPriorityLabel(priority: SupportTicket['priority'], lang: Lang): string {
  const labels: Record<SupportTicket['priority'], { vi: string; en: string }> = {
    low: { vi: 'Thấp', en: 'Low' },
    medium: { vi: 'Trung bình', en: 'Medium' },
    high: { vi: 'Cao', en: 'High' },
    urgent: { vi: 'Khẩn', en: 'Urgent' },
  }
  return labels[priority][lang]
}
