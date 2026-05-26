/** Webhook SePay gửi id số; API v2 sandbox dùng UUID — chuẩn hóa để lưu BIGINT */
export function normalizeSepayTransactionStorageId(raw: string | number): number {
  const n = Number(raw)
  if (Number.isSafeInteger(n) && n > 0) return n

  const s = String(raw)
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i)
    hash |= 0
  }
  const positive = Math.abs(hash)
  return positive > 0 ? positive : 1
}
