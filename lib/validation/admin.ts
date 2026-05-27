import { z } from 'zod'
import {
  emailSchema,
  productIdSchema,
  uuidSchema,
  positiveIntSchema,
  nonNegativeAmountSchema,
} from '@/lib/validation/fields'

export const adminUserIdSchema = z.string().trim().min(1).max(64).optional()

export const adminProductBodySchema = z.object({
  adminUserId: adminUserIdSchema,
  name: z.string().trim().min(1, 'Tên sản phẩm là bắt buộc').max(200),
  name_en: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  description_en: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().positive('Giá phải lớn hơn 0').max(500_000_000),
  basePrice: z.coerce.number().positive().max(500_000_000).optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  category: z.string().trim().max(64).optional(),
  image_url: z.string().max(500).optional().nullable(),
  image: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
  active: z.boolean().optional(),
  coming_soon: z.boolean().optional(),
  comingSoon: z.boolean().optional(),
})

export const adminPoolCreateSchema = z.object({
  adminUserId: adminUserIdSchema,
  product_id: productIdSchema.optional().nullable(),
  service_email: emailSchema,
  service_password: z.string().trim().min(1, 'Mật khẩu tài khoản là bắt buộc').max(256),
  max_slots: z.coerce.number().int().min(1).max(4).optional().default(4),
  slots_used: z.coerce.number().int().min(0).max(4).optional().default(0),
  slot_details: z.array(z.unknown()).optional(),
  status: z.enum(['active', 'inactive', 'banned']).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
})

export const adminBanReasonSchema = z.object({
  adminUserId: adminUserIdSchema,
  code: z.string().trim().min(1).max(64),
  label_vi: z.string().trim().min(1).max(200),
  label_en: z.string().trim().max(200).optional(),
  sort_order: z.coerce.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
})

export const adminRentalBanSchema = z.object({
  adminUserId: adminUserIdSchema,
  banReasonId: uuidSchema,
  adminNote: z.string().trim().max(1000).optional().nullable(),
})

export const adminRentalsQuerySchema = z.object({
  status: z.enum(['active', 'expired', 'revoked', 'all']).optional().default('active'),
  productId: productIdSchema.optional(),
})

export const paginationQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional().default(30),
  limit: z.coerce.number().int().min(10).max(500).optional().default(150),
})

export const emailPaymentSuccessSchema = z.object({
  userId: z.string().trim().min(1).max(64),
  invoiceNumber: z.string().trim().min(1).max(64),
  total: nonNegativeAmountSchema,
  productNames: z.union([z.array(z.string()), z.string()]).optional(),
  language: z.enum(['vi', 'en']).optional(),
})
