import { z } from 'zod'
import type { Lang } from '@/lib/translations'
import { normalizeResetToken } from '@/lib/auth/password-reset'
import {
  createEmailSchema,
  createPasswordSchema,
  emailSchema,
  passwordSchema,
  fullNameSchema,
  languageSchema,
} from '@/lib/validation/fields'

export function createLoginBodySchema(lang: Lang = 'vi') {
  return z.object({
    email: createEmailSchema(lang),
    password: createPasswordSchema(lang),
    language: languageSchema.optional().default('vi'),
  })
}

export const loginBodySchema = createLoginBodySchema('vi')

export function createLoginFormSchema(lang: Lang = 'vi') {
  return createLoginBodySchema(lang)
}

export const registerBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
    language: languageSchema.optional().default('vi'),
  })

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
  language: languageSchema.optional().default('vi'),
})

const resetTokenSchema = z.preprocess(
  (v) => (typeof v === 'string' ? normalizeResetToken(v) : v),
  z.string().min(32, 'Token không hợp lệ').max(128),
)

export const resetPasswordBodySchema = z.object({
  token: resetTokenSchema,
  password: passwordSchema,
  language: languageSchema.optional().default('vi'),
})

export const resetPasswordFormSchema = resetPasswordBodySchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

export const signupFormSchema = registerBodySchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })
