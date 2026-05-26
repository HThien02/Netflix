import crypto from 'crypto'
import { resolvePayosAmountFromCart, PAYOS_MIN_AMOUNT_VND } from '@/lib/payos/client'
import type { Cart } from '@/lib/types'

export { resolvePayosAmountFromCart as resolveSepayAmountFromCart, PAYOS_MIN_AMOUNT_VND as SEPAY_MIN_AMOUNT_VND }

export function isSepayConfigured(): boolean {
  return Boolean(
    process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim() &&
      process.env.SEPAY_BANK_ACCOUNT_NAME?.trim() &&
      (process.env.SEPAY_BANK_NAME?.trim() || process.env.SEPAY_BANK_BIN?.trim()) &&
      process.env.SEPAY_PAYMENT_CODE_PREFIX?.trim(),
  )
}

/** Nội dung CK chuẩn — SePay parse mã NH... từ đây */
export function buildSepayTransferDescription(paymentCode: string): string {
  return `Thanh toan don hang ${paymentCode}`
}

/** QR chính thức SePay — https://qr.sepay.vn/img */
export function buildSepayQrImageUrl(amountVnd: number, paymentCode: string): string {
  const bank = (process.env.SEPAY_BANK_NAME || 'MBBank').trim()
  const acc = process.env.SEPAY_BANK_ACCOUNT_NUMBER!.trim()
  const params = new URLSearchParams({
    bank,
    acc,
    amount: String(Math.round(amountVnd)),
    des: buildSepayTransferDescription(paymentCode),
    template: 'compact',
  })
  return `https://qr.sepay.vn/img?${params.toString()}`
}

/** @deprecated Dùng buildSepayQrImageUrl */
export const buildVietQrImageUrl = buildSepayQrImageUrl

/** Tiền tố mã CK — phải khớp Công ty → Cấu hình chung → Cấu trúc mã thanh toán trên SePay */
export function getSepayPaymentPrefix(): string {
  return (process.env.SEPAY_PAYMENT_CODE_PREFIX || 'NH').trim().toUpperCase()
}

/** Mã thanh toán hiển thị cho khách (SePay parse từ nội dung CK) */
export function generateSepayPaymentCode(): string {
  const prefix = getSepayPaymentPrefix()
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}${suffix}`.slice(0, 20)
}

export function getSepayBankDisplay() {
  return {
    bankBin: process.env.SEPAY_BANK_BIN!.trim(),
    bankName: (process.env.SEPAY_BANK_NAME || '').trim() || 'Ngân hàng',
    accountNumber: process.env.SEPAY_BANK_ACCOUNT_NUMBER!.trim(),
    accountName: process.env.SEPAY_BANK_ACCOUNT_NAME!.trim(),
  }
}

export function normalizeSepayPaymentCode(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null
  const code = String(raw).trim().toUpperCase()
  const prefix = getSepayPaymentPrefix()
  if (!code.startsWith(prefix)) return null
  return code
}

function findPaymentCodeInText(text: string): string | null {
  const upper = text.toUpperCase()
  const prefix = getSepayPaymentPrefix()
  const idx = upper.indexOf(prefix)
  if (idx < 0) return null
  const tail = upper.slice(idx)
  const match = tail.match(new RegExp(`^${prefix}[A-Z0-9]{4,16}`))
  return match ? match[0] : null
}

/** Khớp mã từ webhook với đơn chờ (code hoặc trích từ content/description) */
export function extractPaymentCodeFromWebhook(payload: {
  code?: string | null
  content?: string | null
  description?: string | null
}): string | null {
  const direct = normalizeSepayPaymentCode(payload.code)
  if (direct) return direct

  for (const field of [payload.content, payload.description]) {
    const fromText = findPaymentCodeInText(String(field || ''))
    if (fromText) return fromText
  }
  return null
}

export function amountMatchesOrder(transferAmount: number, expectedVnd: number): boolean {
  return Math.round(transferAmount) >= Math.round(expectedVnd)
}
