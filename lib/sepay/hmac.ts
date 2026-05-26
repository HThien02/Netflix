import crypto from 'crypto'

export function secretKeyCandidates(secret: string): string[] {
  const s = secret.trim()
  const keys = [s]
  if (s.startsWith('whsec_')) keys.push(s.slice(6))
  return [...new Set(keys.filter(Boolean))]
}

/** Các dạng body SePay có thể ký — raw bytes hoặc JSON.stringify(parse) như docs mẫu Node */
export function sepayBodyVariants(rawBody: string): { label: string; body: string }[] {
  const out: { label: string; body: string }[] = []
  if (rawBody) out.push({ label: 'raw', body: rawBody })
  try {
    const parsed = JSON.parse(rawBody) as unknown
    const compact = JSON.stringify(parsed)
    out.push({ label: 'json.stringify', body: compact })
  } catch {
    /* not json */
  }
  const seen = new Set<string>()
  return out.filter((v) => {
    if (seen.has(v.body)) return false
    seen.add(v.body)
    return true
  })
}

/** Đúng mẫu SePay: timestamp (string header) + '.' + payload */
export function sepayHmacSha256(secret: string, timestampHeader: string, payload: string): string {
  const message = `${timestampHeader.trim()}.${payload}`
  const hex = crypto.createHmac('sha256', secret).update(message).digest('hex')
  return `sha256=${hex}`
}

export type SepayHmacCandidate = {
  secretVariant: 'full' | 'without_whsec'
  bodyVariant: string
  expected: string
}

export function buildSepayHmacCandidates(
  secret: string,
  timestampHeader: string,
  rawBody: string,
): SepayHmacCandidate[] {
  const candidates: SepayHmacCandidate[] = []
  for (const key of secretKeyCandidates(secret)) {
    const secretVariant = key === secret.trim() ? 'full' : 'without_whsec'
    for (const { label, body } of sepayBodyVariants(rawBody)) {
      candidates.push({
        secretVariant,
        bodyVariant: label,
        expected: sepayHmacSha256(key, timestampHeader, body),
      })
    }
  }
  return candidates
}

export function timingSafeMatchSignature(expected: string, received: string): boolean {
  const recv = received.trim()
  if (!recv) return false

  const recvForms = new Set<string>([recv])
  if (recv.startsWith('sha256=')) recvForms.add(recv.slice(7))
  else if (/^[a-f0-9]{64}$/i.test(recv)) recvForms.add(`sha256=${recv}`)

  for (const expectedForm of [expected]) {
    const expForms = new Set<string>([expectedForm])
    if (expectedForm.startsWith('sha256=')) expForms.add(expectedForm.slice(7))
    else if (/^[a-f0-9]{64}$/i.test(expectedForm)) expForms.add(`sha256=${expectedForm}`)

    for (const e of expForms) {
      for (const r of recvForms) {
        try {
          if (e.length !== r.length) continue
          if (crypto.timingSafeEqual(Buffer.from(e), Buffer.from(r))) return true
        } catch {
          /* */
        }
      }
    }
  }
  return false
}

export function matchSepayHmac(
  secret: string,
  timestampHeader: string,
  rawBody: string,
  signatureHeader: string,
): SepayHmacCandidate | null {
  for (const c of buildSepayHmacCandidates(secret, timestampHeader, rawBody)) {
    if (timingSafeMatchSignature(c.expected, signatureHeader)) return c
  }
  return null
}
