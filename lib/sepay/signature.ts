function normalizeEnvSecret(value: string | undefined): string {
  if (!value) return ''
  return value.trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
}

function verifyApiKey(request: Request, key: string): boolean {
  const auth = (request.headers.get('authorization') || '').trim()
  return auth === `Apikey ${key}` || auth === key
}

/** Xác thực webhook SePay — API Key (header Authorization: Apikey &lt;key&gt;) */
export function verifySepayWebhookRequest(
  request: Request,
  _rawBody: string,
): { ok: true } | { ok: false; message: string } {
  const mode = (process.env.SEPAY_WEBHOOK_AUTH || 'apikey').toLowerCase()

  if (mode === 'none') {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, message: 'SEPAY_WEBHOOK_AUTH=none not allowed in production' }
    }
    return { ok: true }
  }

  if (mode !== 'apikey') {
    return {
      ok: false,
      message: `SEPAY_WEBHOOK_AUTH=${mode} không còn hỗ trợ — dùng apikey và cấu hình API Key trên my.sepay.vn.`,
    }
  }

  const key = normalizeEnvSecret(process.env.SEPAY_WEBHOOK_API_KEY)
  if (!key) {
    return { ok: false, message: 'Missing SEPAY_WEBHOOK_API_KEY' }
  }

  if (!verifyApiKey(request, key)) {
    return {
      ok: false,
      message:
        'Invalid Apikey — SEPAY_WEBHOOK_API_KEY trên Vercel phải khớp API Key webhook trên my.sepay.vn (Authorization: Apikey ...).',
    }
  }

  return { ok: true }
}
