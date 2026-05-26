import { matchSepayHmac } from '@/lib/sepay/hmac'

const REPLAY_WINDOW_SEC = 300

function parseUnixTimestamp(raw: string): number | null {
  const n = Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return null
  if (n > 1_000_000_000_000) return Math.floor(n / 1000)
  return Math.floor(n)
}

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
    const auth = (request.headers.get('authorization') || '').trim()
    const expected = `Apikey ${key}`
    if (auth !== expected && auth !== key) {
      return { ok: false, message: 'Invalid Apikey' }
    }
    return { ok: true }
  }

  const secret = process.env.SEPAY_WEBHOOK_SECRET?.trim()
  if (!secret) return { ok: false, message: 'Missing SEPAY_WEBHOOK_SECRET' }

  const signature =
    request.headers.get('x-sepay-signature') ||
    request.headers.get('X-SePay-Signature') ||
    ''

  const timestampHeader =
    request.headers.get('x-sepay-timestamp') ||
    request.headers.get('X-SePay-Timestamp') ||
    ''

  if (!timestampHeader.trim()) {
    return { ok: false, message: 'Missing X-SePay-Timestamp' }
  }

  const timestamp = parseUnixTimestamp(timestampHeader)
  if (!timestamp) {
    return { ok: false, message: 'Invalid X-SePay-Timestamp' }
  }

  const drift = Math.abs(Math.floor(Date.now() / 1000) - timestamp)
  if (drift > REPLAY_WINDOW_SEC) {
    return {
      ok: false,
      message: `Request expired (drift ${drift}s, max ${REPLAY_WINDOW_SEC}s)`,
    }
  }

  if (!signature) {
    const auth = (request.headers.get('authorization') || '').trim()
    const apiKey = process.env.SEPAY_WEBHOOK_API_KEY?.trim()
    if (apiKey && (auth === `Apikey ${apiKey}` || auth === apiKey)) {
      return { ok: true }
    }
    return { ok: false, message: 'Missing X-SePay-Signature' }
  }

  const matched = matchSepayHmac(secret, timestampHeader, rawBody, signature)
  if (!matched) {
    return {
      ok: false,
      message:
        'Invalid HMAC signature — SEPAY_WEBHOOK_SECRET trên server phải khớp Secret webhook trên my.sepay.vn.',
    }
  }

  return { ok: true }
}
