import { amountMatchesOrder } from '@/lib/sepay/client'

/** Trích orderCode PayOS (6–9 chữ số) từ nội dung CK — dùng khi QR PayOS trỏ TK thường */
export function extractPayosOrderCodeFromTransfer(payload: {
  code?: string | null
  content?: string | null
}): number | null {
  const candidates: string[] = []
  if (payload.code != null && payload.code !== '') {
    candidates.push(String(payload.code).trim())
  }
  const content = String(payload.content || '')
  const digitMatches = content.match(/\d{6,9}/g)
  if (digitMatches) candidates.push(...digitMatches)

  for (const raw of candidates) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 6 || digits.length > 9) continue
    const orderCode = Number(digits)
    if (Number.isSafeInteger(orderCode) && orderCode > 0) return orderCode
  }
  return null
}

export function transferMatchesPayosOrder(
  transferAmount: number,
  expectedVnd: number,
): boolean {
  return amountMatchesOrder(transferAmount, expectedVnd)
}
