import { z } from 'zod'
import { normalizeSlotsForPlan, planTypeSchema } from '@/lib/validation/plan'
import { productIdSchema, nonNegativeAmountSchema } from '@/lib/validation/fields'

export const cartItemSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    productId: productIdSchema,
    quantity: z.coerce.number().int().min(1).max(10),
    planType: planTypeSchema,
    slots: z.coerce.number().int().min(1).max(4),
    price: nonNegativeAmountSchema,
    productName: z.string().trim().max(200).optional(),
  })
  .transform((item) => ({
    ...item,
    slots: normalizeSlotsForPlan(item.planType, item.slots),
    quantity: 1,
  }))

export const cartSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    userId: z.string().trim().min(1).max(64).optional(),
    items: z.array(cartItemSchema).min(1, 'Giỏ hàng trống').max(5, 'Tối đa 5 gói mỗi đơn'),
    subtotal: nonNegativeAmountSchema,
    taxAmount: nonNegativeAmountSchema,
    discount: nonNegativeAmountSchema,
    couponCode: z.string().trim().max(32).optional(),
    total: nonNegativeAmountSchema,
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .superRefine((cart, ctx) => {
    if (cart.total > 500_000_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tổng tiền vượt giới hạn',
        path: ['total'],
      })
    }
    const itemSum = cart.items.reduce((s, i) => s + i.price, 0)
    if (Math.abs(itemSum - cart.subtotal) > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tổng phụ không khớp các dòng',
        path: ['subtotal'],
      })
    }
  })

export const productNamesSchema = z.record(
  z.string().min(1).max(64),
  z.string().trim().min(1).max(200),
)
