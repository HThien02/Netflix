import { differenceInCalendarDays, startOfDay } from 'date-fns'

export type PlanType =
  | 'daily_1'
  | 'daily_3'
  | 'daily_7'
  | 'monthly'
  | 'quarterly'
  | 'annual'

export const SHORT_TERM_PLANS: PlanType[] = ['daily_1', 'daily_3', 'daily_7']
export const LONG_TERM_PLANS: PlanType[] = ['monthly', 'quarterly', 'annual']

export function isShortTermPlan(plan: PlanType): boolean {
  return SHORT_TERM_PLANS.includes(plan)
}

/** Số ngày cố định — chỉ dùng cho gói ngắn hạn */
export function planDurationDays(plan: PlanType): number {
  switch (plan) {
    case 'daily_1':
      return 1
    case 'daily_3':
      return 3
    case 'daily_7':
      return 7
    default:
      return 0
  }
}

export function planMonths(plan: PlanType): number {
  if (plan === 'quarterly') return 3
  if (plan === 'annual') return 12
  if (plan === 'monthly') return 1
  return 0
}

/** Cuối ngày theo giờ địa phương — tránh lệch ngày khi hiển thị / đếm */
export function endOfLocalDay(date: Date): Date {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}

/**
 * Ngày hết hạn:
 * - Ngắn hạn: +N ngày lịch
 * - Dài hạn: cùng ngày trong tháng sau (+1/3/12 tháng), VD mua 28/04 → hết 28/05
 * Luôn lưu 23:59:59.999 ngày hết hạn (giờ local).
 */
export function addPlanExpiry(from: Date, plan: PlanType): Date {
  const end = new Date(from)
  if (isShortTermPlan(plan)) {
    end.setDate(end.getDate() + planDurationDays(plan))
  } else {
    end.setMonth(end.getMonth() + planMonths(plan))
  }
  return endOfLocalDay(end)
}

/**
 * Số ngày còn lại (theo ngày lịch, không dùng ceil ms).
 * Gói tháng+: mua 26/05 → hết 26/06 hiển thị ~30 ngày (không phải 31).
 */
export function daysUntilExpiry(
  expiresAt: Date,
  plan: PlanType,
  now: Date = new Date(),
): number {
  const diff = differenceInCalendarDays(startOfDay(expiresAt), startOfDay(now))
  if (diff <= 0) return 0
  if (!isShortTermPlan(plan) && diff > 1) {
    return diff - 1
  }
  return diff
}

export function formatPlanExpiry(date: Date, lang: 'vi' | 'en'): string {
  return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function planExpiryDescription(from: Date, plan: PlanType, lang: 'vi' | 'en'): string {
  const end = addPlanExpiry(from, plan)
  const endStr = formatPlanExpiry(end, lang)
  if (lang === 'vi') {
    if (isShortTermPlan(plan)) {
      return `Hết hạn sau ${planDurationDays(plan)} ngày (${endStr})`
    }
    const m = planMonths(plan)
    return `Hết hạn ${endStr} (cùng ngày, +${m} tháng lịch)`
  }
  if (isShortTermPlan(plan)) {
    return `Expires in ${planDurationDays(plan)} day(s) (${endStr})`
  }
  const m = planMonths(plan)
  return `Expires ${endStr} (same calendar day, +${m} month(s))`
}

export function planLabel(plan: PlanType, lang: 'vi' | 'en'): string {
  const labels: Record<PlanType, { vi: string; en: string }> = {
    daily_1: { vi: '1 ngày', en: '1 day' },
    daily_3: { vi: '3 ngày', en: '3 days' },
    daily_7: { vi: '7 ngày', en: '7 days' },
    monthly: { vi: 'Hàng tháng', en: 'Monthly' },
    quarterly: { vi: '3 tháng', en: '3 months' },
    annual: { vi: 'Hàng năm', en: 'Yearly' },
  }
  return labels[plan][lang]
}
