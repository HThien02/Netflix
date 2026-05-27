import { NextResponse } from 'next/server'
import type { ZodError, ZodSchema } from 'zod'
import type { Lang } from '@/lib/translations'
import { validationMsg } from '@/lib/validation/messages'

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export function formatZodError(error: ZodError, lang: Lang = 'vi'): string {
  return error.issues[0]?.message || validationMsg(lang, 'invalidJson')
}

export function validationErrorResponse(error: ZodError, lang: Lang = 'vi') {
  return NextResponse.json(
    {
      error: formatZodError(error, lang),
      fields: zodFieldErrors(error),
    },
    { status: 400 },
  )
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
  lang: Lang = 'vi',
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: validationMsg(lang, 'invalidJson') },
        { status: 400 },
      ),
    }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, response: validationErrorResponse(parsed.error, lang) }
  }
  return { ok: true, data: parsed.data }
}

export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
  lang: Lang = 'vi',
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const raw = Object.fromEntries(searchParams.entries())
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, response: validationErrorResponse(parsed.error, lang) }
  }
  return { ok: true, data: parsed.data }
}
