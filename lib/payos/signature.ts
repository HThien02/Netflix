import crypto from 'crypto'

function sortObjByKey<T extends Record<string, unknown>>(obj: T): T {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key as keyof T] = obj[key as keyof T]
      return acc
    }, {} as T)
}

/** https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/ */
export function payosDataQueryString(data: Record<string, unknown>): string {
  const sorted = sortObjByKey(data)
  return Object.keys(sorted)
    .map((key) => {
      let value: unknown = sorted[key]
      if (Array.isArray(value)) {
        value = JSON.stringify(
          value.map((item) =>
            typeof item === 'object' && item !== null
              ? sortObjByKey(item as Record<string, unknown>)
              : item,
          ),
        )
      }
      if (value === null || value === undefined || value === 'undefined' || value === 'null') {
        value = ''
      }
      return `${key}=${value}`
    })
    .join('&')
}

export function signPayosDataObject(
  data: Record<string, unknown>,
  checksumKey: string,
): string {
  return crypto.createHmac('sha256', checksumKey).update(payosDataQueryString(data)).digest('hex')
}

/** Webhook + response API payment-requests (sort key alphabet, HMAC_SHA256) */
export function verifyPayosDataSignature(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string,
): boolean {
  if (!signature) return false
  const expected = signPayosDataObject(data, checksumKey)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return expected === signature
  }
}

/** @deprecated Use verifyPayosDataSignature */
export const verifyPayosWebhookData = verifyPayosDataSignature

export type PayosApiEnvelope<T = Record<string, unknown>> = {
  code: string
  desc: string
  data?: T
  signature?: string
}

/** PayOS trả { code, desc, data, signature } — bắt buộc verify data trước khi dùng */
export function assertPayosResponseIntegrity(
  envelope: PayosApiEnvelope<Record<string, unknown>>,
  checksumKey: string,
): Record<string, unknown> {
  const data = envelope.data
  const signature = envelope.signature
  if (!data || typeof data !== 'object') {
    throw new Error('PayOS response thiếu data')
  }
  if (!signature) {
    throw new Error('PayOS response thiếu signature')
  }
  if (!verifyPayosDataSignature(data, signature, checksumKey)) {
    throw new Error(
      'PayOS signature không khớp — kiểm tra PAYOS_CHECKSUM_KEY (Checksum Key đúng kênh thanh toán)',
    )
  }
  return data
}
