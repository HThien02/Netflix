import { z } from 'zod'

export const languageSchema = z.enum(['vi', 'en'])

export const emailSchema = z
  .string({ required_error: 'Email là bắt buộc' })
  .trim()
  .toLowerCase()
  .min(5, 'Email quá ngắn')
  .max(254, 'Email quá dài')
  .email('Email không hợp lệ')

export const optionalEmailSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  emailSchema.optional(),
)

export const passwordSchema = z
  .string({ required_error: 'Mật khẩu là bắt buộc' })
  .min(6, 'Mật khẩu tối thiểu 6 ký tự')
  .max(128, 'Mật khẩu quá dài')

export const fullNameSchema = z
  .string({ required_error: 'Họ tên là bắt buộc' })
  .trim()
  .min(1, 'Họ tên là bắt buộc')
  .max(120, 'Họ tên quá dài')

export const phoneSchema = z
  .string()
  .trim()
  .max(20, 'Số điện thoại quá dài')
  .regex(/^[0-9+\s()-]*$/, 'Số điện thoại không hợp lệ')
  .optional()
  .or(z.literal(''))

export const addressLineSchema = z.string().trim().max(200, 'Địa chỉ quá dài').optional().or(z.literal(''))

export const uuidSchema = z.string().uuid('ID không hợp lệ')

export const productIdSchema = z
  .string()
  .trim()
  .min(1, 'Thiếu mã sản phẩm')
  .max(64, 'Mã sản phẩm quá dài')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Mã sản phẩm không hợp lệ')

export const positiveIntSchema = (max = Number.MAX_SAFE_INTEGER) =>
  z.coerce.number().int().min(1).max(max)

export const nonNegativeAmountSchema = z.coerce.number().min(0).max(500_000_000)
