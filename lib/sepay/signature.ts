function normalizeEnvSecret(value: string | undefined): string {
  if (!value) return ''
  return value.trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
}

function verifyApiKey(request: Request, key: string): boolean {
  const auth = (request.headers.get('authorization') || '').trim()
  return auth === `Apikey ${key}` || auth === key
}

/** Xác thực webhook SePay — API Key (Authorization: Apikey &lt;key&gt;). Bỏ qua SEPAY_WEBHOOK_AUTH cũ (hmac). */
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

  const key = normalizeEnvSecret(process.env.SEPAY_WEBHOOK_API_KEY)
  if (!key) {
    return {
      ok: false,
      message:
        'Missing SEPAY_WEBHOOK_API_KEY — thêm trên Vercel (Production) và trùng API Key trên my.sepay.vn.',
    }
  }

  if (!verifyApiKey(request, key)) {
    return {
      ok: false,
      message:
        'Invalid Apikey — SEPAY_WEBHOOK_API_KEY trên server phải khớp API Key webhook trên my.sepay.vn.',
    }
  }

  return { ok: true }
}
