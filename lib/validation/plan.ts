import { z } from 'zod'
import { isShortTermPlan, type PlanType } from '@/lib/plans'

export const planTypeSchema = z.enum(
  ['daily_1', 'daily_3', 'daily_7', 'monthly', 'quarterly', 'annual'],
  { errorMap: () => ({ message: 'Loại gói không hợp lệ' }) },
)

export function normalizeSlotsForPlan(planType: PlanType, slots: number): number {
  if (isShortTermPlan(planType)) return 1
  return Math.min(4, Math.max(1, Math.floor(slots)))
}
