/** Parse số tiền VND từ webhook SePay (number hoặc string). */
export function parseTransferAmountVnd(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.round(raw)
  }
  const digits = String(raw ?? '').replace(/[^\d]/g, '')
  if (!digits) return 0
  return Math.round(Number(digits))
}
