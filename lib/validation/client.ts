import type { ZodSchema } from 'zod'
import { formatZodError, zodFieldErrors } from '@/lib/validation/parse'
import type { Lang } from '@/lib/translations'

export type ClientValidateResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors: Record<string, string> }

export function validateClient<T>(
  schema: ZodSchema<T>,
  data: unknown,
  language: Lang = 'vi',
): ClientValidateResult<T> {
  const parsed = schema.safeParse(data)
  if (parsed.success) {
    return { success: true, data: parsed.data }
  }
  return {
    success: false,
    error: formatZodError(parsed.error, language),
    fieldErrors: zodFieldErrors(parsed.error),
  }
}
