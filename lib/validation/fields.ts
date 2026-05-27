import { z } from 'zod'
import type { Lang } from '@/lib/translations'
import { validationMsg } from '@/lib/validation/messages'

export const languageSchema = z.enum(['vi', 'en'])

const TYPO_TLDS = new Set(['con', 'cmo', 'comm', 'coom', 'cim', 'om', 'cm'])

function isPlausibleEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  const labels = domain.split('.')
  if (labels.length < 2) return false
  const tld = labels[labels.length - 1]
  if (!/^[a-z]{2,24}$/.test(tld)) return false
  if (TYPO_TLDS.has(tld)) return false
  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
}

export function createEmailSchema(lang: Lang = 'vi') {
  return z
    .string({ required_error: validationMsg(lang, 'emailRequired') })
    .trim()
    .toLowerCase()
    .min(5, validationMsg(lang, 'emailTooShort'))
    .max(254, validationMsg(lang, 'emailTooLong'))
    .email(validationMsg(lang, 'emailInvalid'))
    .refine(isPlausibleEmailDomain, { message: validationMsg(lang, 'emailInvalid') })
}

/** Mặc định tiếng Việt — tương thích import cũ */
export const emailSchema = createEmailSchema('vi')

export function createOptionalEmailSchema(lang: Lang = 'vi') {
  return z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    createEmailSchema(lang).optional(),
  )
}

export const optionalEmailSchema = createOptionalEmailSchema('vi')

export function createPasswordSchema(lang: Lang = 'vi') {
  return z
    .string({ required_error: validationMsg(lang, 'passwordRequired') })
    .min(6, validationMsg(lang, 'passwordTooShort'))
    .max(128, validationMsg(lang, 'passwordTooLong'))
}

export const passwordSchema = createPasswordSchema('vi')

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
