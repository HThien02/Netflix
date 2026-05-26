import { z } from 'zod'

export const packageReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
})
