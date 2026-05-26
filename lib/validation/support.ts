import { z } from 'zod'

export const createSupportTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, 'Tiêu đề tối thiểu 3 ký tự')
    .max(200, 'Tiêu đề quá dài'),
  description: z
    .string()
    .trim()
    .min(10, 'Mô tả tối thiểu 10 ký tự')
    .max(5000, 'Mô tả quá dài'),
  category: z.string().trim().max(100).optional(),
})
