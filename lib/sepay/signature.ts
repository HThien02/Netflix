import crypto from 'crypto'

const REPLAY_WINDOW_SEC = 300

/** Xác thực webhook SePay — HMAC-SHA256 (khuyến nghị) hoặc Apikey */
export function verifySepayWebhookRequest(
  request: Request,
  rawBody: string,
): { ok: true } | { ok: false; message: string } {
  const mode = (process.env.SEPAY_WEBHOOK_AUTH || 'hmac').toLowerCase()

  if (mode === 'none') {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, message: 'SEPAY_WEBHOOK_AUTH=none not allowed in production' }
    }
    return { ok: true }
  }

  if (mode === 'apikey') {
    const key = process.env.SEPAY_WEBHOOK_API_KEY?.trim()
    if (!key) return { ok: false, message: 'Missing SEPAY_WEBHOOK_API_KEY' }
    const auth = request.headers.get('authorization') || ''
    const expected = `Apikey ${key}`
    if (auth !== expected) return { ok: false, message: 'Invalid Apikey' }
    return { ok: true }
  }

  const secret = process.env.SEPAY_WEBHOOK_SECRET?.trim()
  if (!secret) return { ok: false, message: 'Missing SEPAY_WEBHOOK_SECRET' }

  const signature =
    request.headers.get('x-sepay-signature') ||
    request.headers.get('X-SePay-Signature') ||
    ''
  const timestampRaw =
    request.headers.get('x-sepay-timestamp') ||
    request.headers.get('X-SePay-Timestamp') ||
    '0'
  const timestamp = Number(timestampRaw)
  if (!timestamp || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > REPLAY_WINDOW_SEC) {
    return { ok: false, message: 'Request expired or invalid timestamp' }
  }

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`
  if (!signature || signature.length !== expected.length) {
    return { ok: false, message: 'Invalid HMAC signature' }
  }
  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return { ok: false, message: 'Invalid HMAC signature' }
    }
  } catch {
    return { ok: false, message: 'Invalid HMAC signature' }
  }

  return { ok: true }
}
