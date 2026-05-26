import { z } from 'zod'
import {
  emailSchema,
  passwordSchema,
  fullNameSchema,
  languageSchema,
} from '@/lib/validation/fields'

export const loginBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

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

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(32, 'Token không hợp lệ').max(128),
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
