import { z } from 'zod'
import {
  emailSchema,
  optionalEmailSchema,
  fullNameSchema,
  phoneSchema,
  addressLineSchema,
  languageSchema,
} from '@/lib/validation/fields'
import { cartSchema, productNamesSchema } from '@/lib/validation/cart'

export const checkoutBillingSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: addressLineSchema,
  city: addressLineSchema,
})

export const paymentCreateBodySchema = z.object({
  cart: cartSchema,
  userId: z.string().optional(),
  language: languageSchema.optional().default('vi'),
  productNames: productNamesSchema.optional().default({}),
  buyerName: fullNameSchema.optional(),
  buyerEmail: optionalEmailSchema,
  buyerPhone: phoneSchema,
  buyerAddress: addressLineSchema,
  fullName: fullNameSchema.optional(),
  email: optionalEmailSchema,
  phone: phoneSchema,
  address: addressLineSchema,
})

export const sepayPaymentCreateBodySchema = z.object({
  cart: cartSchema,
  userId: z.string().optional(),
  language: languageSchema.optional().default('vi'),
  productNames: productNamesSchema.optional().default({}),
})

export const payosFinishBodySchema = z.object({
  orderCode: z.coerce.number().int().positive().max(999_999_999),
  code: z.string().trim().max(10).nullable().optional(),
  status: z.string().trim().max(32).nullable().optional(),
  cancel: z.string().trim().max(10).nullable().optional(),
  language: languageSchema.optional().default('vi'),
  cart: cartSchema.optional(),
  productNames: productNamesSchema.optional(),
})

export const payosVerifyQuerySchema = z.object({
  orderCode: z.coerce.number().int().positive().max(999_999_999),
})

export const sepayVerifyQuerySchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, 'Mã thanh toán không hợp lệ')
    .max(24, 'Mã thanh toán quá dài')
    .regex(/^[A-Z0-9]+$/, 'Mã thanh toán chỉ gồm chữ và số'),
  wait: z.coerce.number().int().min(0).max(55).optional().default(0),
})

export const sepayOrderQuerySchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(4)
    .max(24)
    .regex(/^[A-Z0-9]+$/),
})

export const completeOrderBodySchema = z.object({
  userId: z.string().trim().min(1).max(64),
  userEmail: emailSchema.optional(),
  userName: fullNameSchema.optional(),
  language: languageSchema.optional().default('vi'),
  cart: cartSchema,
  productNames: productNamesSchema,
  paymentMethod: z.enum(['payos', 'sepay', 'credit_card', 'wallet']),
})
