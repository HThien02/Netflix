import crypto from 'crypto'

const REPLAY_WINDOW_SEC = 300

function secretKeyCandidates(secret: string): string[] {
  const s = secret.trim()
  const keys = [s]
  if (s.startsWith('whsec_')) keys.push(s.slice(6))
  return [...new Set(keys.filter(Boolean))]
}

function parseUnixTimestamp(raw: string): number | null {
  const n = Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return null
  if (n > 1_000_000_000_000) return Math.floor(n / 1000)
  return Math.floor(n)
}

function hmacHex(secret: string, message: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex')
}

function signatureVariants(hex: string): string[] {
  return [`sha256=${hex}`, hex]
}

function timingSafeMatch(expected: string, received: string): boolean {
  const recv = received.trim()
  if (!recv) return false

  const recvForms = new Set<string>([recv])
  if (recv.startsWith('sha256=')) recvForms.add(recv.slice(7))
  else if (/^[a-f0-9]{64}$/i.test(recv)) recvForms.add(`sha256=${recv}`)

  const expForms = new Set<string>([expected])
  if (expected.startsWith('sha256=')) expForms.add(expected.slice(7))
  else if (/^[a-f0-9]{64}$/i.test(expected)) expForms.add(`sha256=${expected}`)

  for (const e of expForms) {
    for (const r of recvForms) {
      try {
        if (e.length !== r.length) continue
        if (crypto.timingSafeEqual(Buffer.from(e), Buffer.from(r))) return true
      } catch {
        /* length mismatch */
      }
    }
  }
  return false
}

function verifyHmacSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string,
  timestamp: number,
): boolean {
  const signedPayloads = [`${timestamp}.${rawBody}`, rawBody]

  for (const key of secretKeyCandidates(secret)) {
    for (const payload of signedPayloads) {
      const hex = hmacHex(key, payload)
      for (const expected of signatureVariants(hex)) {
        if (timingSafeMatch(expected, signatureHeader)) return true
      }
    }
  }
  return false
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
    request.headers.get('x-sepay-signature'.toUpperCase()) ||
    ''

  const timestampRaw =
    request.headers.get('x-sepay-timestamp') ||
    request.headers.get('X-SePay-Timestamp') ||
    ''

  const timestamp = parseUnixTimestamp(timestampRaw)
  if (!timestamp) {
    return { ok: false, message: 'Missing or invalid X-SePay-Timestamp' }
  }

  const drift = Math.abs(Math.floor(Date.now() / 1000) - timestamp)
  if (drift > REPLAY_WINDOW_SEC) {
    return {
      ok: false,
      message: `Request expired (timestamp drift ${drift}s, max ${REPLAY_WINDOW_SEC}s)`,
    }
  }

  if (!signature) {
    const auth = (request.headers.get('authorization') || '').trim()
    const apiKey = process.env.SEPAY_WEBHOOK_API_KEY?.trim()
    if (apiKey && (auth === `Apikey ${apiKey}` || auth === apiKey)) {
      return { ok: true }
    }
    return {
      ok: false,
      message:
        'Missing X-SePay-Signature. Trên SePay chọn HMAC-SHA256 và copy Secret vào SEPAY_WEBHOOK_SECRET (hoặc đổi SEPAY_WEBHOOK_AUTH=apikey).',
    }
  }

  if (!verifyHmacSignature(secret, rawBody, signature, timestamp)) {
    return {
      ok: false,
      message:
        'Invalid HMAC signature — Secret trên Vercel phải khớp webhook SePay (tạo lại Secret trên my.sepay.vn nếu cần).',
    }
  }

  return { ok: true }
}
