import crypto from 'crypto'
import { assertPayosResponseIntegrity, type PayosApiEnvelope } from '@/lib/payos/signature'
import type { Cart } from '@/lib/types'

function verifyPayosJson<T extends Record<string, unknown>>(json: PayosApiEnvelope<T>): T {
  return assertPayosResponseIntegrity(
    json as PayosApiEnvelope<Record<string, unknown>>,
    process.env.PAYOS_CHECKSUM_KEY!,
  ) as T
}

/** PayOS yêu cầu tối thiểu 10.000 VND (giống code React mẫu của bạn) */
export const PAYOS_MIN_AMOUNT_VND = 10_000

/** Nội dung CK: tối đa 9 ký tự nếu TK ngân hàng không liên kết qua payOS */
export const PAYOS_DESCRIPTION_MAX_LEN = 9

/** Mô tả thanh toán — chỉ orderCode để ngân hàng đối soát (≤9 ký tự) */
export function formatPayosDescription(orderCode: number): string {
  return String(orderCode).slice(0, PAYOS_DESCRIPTION_MAX_LEN)
}

export function isPayosConfigured(): boolean {
  return Boolean(
    process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY,
  )
}

export type PayosBuyer = {
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  buyerAddress: string
}

/** Tính tiền VND từ giỏ — server-side */
export function resolvePayosAmountFromCart(cart: Cart) {
  const subtotal = (cart.items || []).reduce(
    (sum, item) =>
      sum + Math.round(Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
    0,
  )
  const taxAmount = Math.round(subtotal * 0.1)
  const discount = Math.round(Number(cart.discount) || 0)
  let amountVnd = subtotal + taxAmount - discount
  if (amountVnd <= 0 && subtotal > 0) amountVnd = subtotal + taxAmount
  amountVnd = Math.max(PAYOS_MIN_AMOUNT_VND, Math.round(amountVnd))
  return { amountVnd, subtotal, taxAmount, discount }
}

/**
 * Chữ ký giống CryptoJS.HmacSHA256(data, checksumKey).toString(Hex):
 * amount=...&cancelUrl=...&description=...&orderCode=...&returnUrl=...
 */
export function signCreatePaymentRequest(data: {
  amount: number
  cancelUrl: string
  description: string
  orderCode: number
  returnUrl: string
}): string {
  const raw = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`
  return crypto
    .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY!)
    .update(raw)
    .digest('hex')
}

/** orderCode unique — số nguyên dương (PayOS Int32) */
export function generatePayosOrderCode(): number {
  const base = Math.floor(Date.now() / 1000)
  const rand = Math.floor(Math.random() * 900) + 100
  return Number(`${base}${rand}`.slice(-9))
}

export type CreatePayosBody = {
  orderCode: number
  amount: number
  description: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  buyerAddress: string
  items: []
  cancelUrl: string
  returnUrl: string
  expiredAt: number
  signature: string
}

export function buildCreatePaymentBody(input: {
  orderCode: number
  amountVnd: number
  description: string
  returnUrl: string
  cancelUrl: string
  buyer: PayosBuyer
  expiredAt?: number
}): CreatePayosBody {
  const amount = Math.max(PAYOS_MIN_AMOUNT_VND, Math.round(input.amountVnd))
  const description = input.description.slice(0, PAYOS_DESCRIPTION_MAX_LEN)
  const returnUrl = input.returnUrl
  const cancelUrl = input.cancelUrl
  const expiredAt = input.expiredAt ?? Math.floor(Date.now() / 1000) + 30 * 60

  const signature = signCreatePaymentRequest({
    amount,
    cancelUrl,
    description,
    orderCode: input.orderCode,
    returnUrl,
  })

  return {
    orderCode: input.orderCode,
    amount,
    description,
    buyerName: input.buyer.buyerName,
    buyerEmail: input.buyer.buyerEmail,
    buyerPhone: input.buyer.buyerPhone,
    buyerAddress: input.buyer.buyerAddress,
    items: [],
    cancelUrl,
    returnUrl,
    expiredAt,
    signature,
  }
}

export async function createPaymentLink(input: {
  orderCode: number
  amountVnd: number
  description: string
  returnUrl: string
  cancelUrl: string
  buyer: PayosBuyer
  expiredAt?: number
}) {
  if (!isPayosConfigured()) {
    throw new Error('PayOS not configured')
  }

  const body = buildCreatePaymentBody(input)

  const res = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.PAYOS_CLIENT_ID!,
      'x-api-key': process.env.PAYOS_API_KEY!,
    },
    body: JSON.stringify(body),
  })

  const json = (await res.json()) as PayosApiEnvelope<Record<string, unknown>>
  if (!res.ok || json.code !== '00') {
    throw new Error(json.desc || 'PayOS create payment failed')
  }

  const data = verifyPayosJson(json)
  let checkoutUrl = String(data.checkoutUrl || '')

  // Chỉ đổi sang next.* khi bật env — mặc định dùng URL PayOS trả về (ổn định hơn trên mobile)
  if (process.env.PAYOS_USE_NEXT_CHECKOUT === 'true') {
    if (checkoutUrl.startsWith('https://dev.pay.payos.vn')) {
      checkoutUrl = checkoutUrl.replace('https://dev.pay.payos.vn', 'https://next.dev.pay.payos.vn')
    } else if (checkoutUrl.startsWith('https://pay.payos.vn')) {
      checkoutUrl = checkoutUrl.replace('https://pay.payos.vn', 'https://next.pay.payos.vn')
    }
  }

  const responseAmount = Number(data.amount)
  if (responseAmount === 0 && body.amount >= PAYOS_MIN_AMOUNT_VND) {
    throw new Error(
      `PayOS trả amount=0 (đã gửi ${body.amount}đ). Kiểm tra PAYOS_CHECKSUM_KEY và kênh thanh toán.`,
    )
  }

  return {
    checkoutUrl,
    paymentLinkId: data.paymentLinkId as string | undefined,
    amountSent: body.amount,
    amountReturned: responseAmount,
    descriptionSent: body.description,
    descriptionReturned: String(data.description || body.description),
    orderCode: data.orderCode as number | undefined,
    bin: data.bin as string | undefined,
    qrCode: data.qrCode as string | undefined,
    accountNumber: data.accountNumber as string | undefined,
    accountName: data.accountName as string | undefined,
    status: data.status as string | undefined,
  }
}

export type PayosTransferInfo = {
  orderCode: number
  amountVnd: number
  description: string
  bin?: string
  accountNumber?: string
  accountName?: string
  qrCode?: string
  checkoutUrl: string
}

/** Đăng ký webhook URL lên kênh PayOS (cần URL public, ví dụ ngrok) */
export async function confirmPayosWebhookUrl(webhookUrl: string) {
  if (!isPayosConfigured()) throw new Error('PayOS not configured')

  const res = await fetch('https://api-merchant.payos.vn/confirm-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.PAYOS_CLIENT_ID!,
      'x-api-key': process.env.PAYOS_API_KEY!,
    },
    body: JSON.stringify({ webhookUrl }),
  })
  const json = (await res.json()) as PayosApiEnvelope<Record<string, unknown>>
  if (!res.ok || json.code !== '00') {
    throw new Error(json.desc || 'PayOS confirm webhook failed')
  }
  return verifyPayosJson(json)
}

export type PayosPaymentInfo = {
  status?: string
  amount?: number
  amountPaid?: number
  amountRemaining?: number
}

export async function getPaymentByOrderCode(orderCode: number): Promise<PayosPaymentInfo | null> {
  if (!isPayosConfigured()) return null

  const res = await fetch(
    `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`,
    {
      headers: {
        'x-client-id': process.env.PAYOS_CLIENT_ID!,
        'x-api-key': process.env.PAYOS_API_KEY!,
      },
    },
  )
  const json = (await res.json()) as PayosApiEnvelope<PayosPaymentInfo>
  if (!res.ok || json.code !== '00') return null
  return verifyPayosJson(json) as PayosPaymentInfo
}

export function isPayosPaymentPaid(data: PayosPaymentInfo | null | undefined): boolean {
  if (!data) return false
  const status = String(data.status || '').toUpperCase()
  if (status === 'PAID') return true
  const amount = Number(data.amount) || 0
  const paid = Number(data.amountPaid) || 0
  const remaining = Number(data.amountRemaining)
  if (amount > 0 && paid >= amount) return true
  if (amount > 0 && remaining === 0 && paid > 0) return true
  return false
}

/** Query params PayOS gắn khi redirect về returnUrl */
export function isPayosReturnPaid(params: {
  code?: string | null
  status?: string | null
  cancel?: string | null
}): boolean {
  if (params.cancel === 'true' || params.cancel === '1') return false
  const code = String(params.code ?? '').trim()
  const status = String(params.status || '').toUpperCase()
  const codeOk = code === '00' || code === '0'
  if (codeOk && (status === 'PAID' || status === 'SUCCESS' || status === 'COMPLETED')) return true
  if (status === 'PAID' || status === 'SUCCESS' || status === 'COMPLETED') return true
  return false
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** PayOS đôi khi cập nhật trạng thái trễ vài giây sau khi redirect */
export async function confirmPayosPaid(
  orderCode: number,
  returnParams: { code?: string | null; status?: string | null; cancel?: string | null },
): Promise<{ paid: boolean; data: PayosPaymentInfo | null }> {
  if (isPayosReturnPaid(returnParams)) {
    return { paid: true, data: await getPaymentByOrderCode(orderCode) }
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const data = await getPaymentByOrderCode(orderCode)
    if (isPayosPaymentPaid(data)) {
      return { paid: true, data }
    }
    if (attempt < 19) await sleep(3000)
  }

  return { paid: false, data: await getPaymentByOrderCode(orderCode) }
}

export function isPayosReturnCancelled(params: {
  status?: string | null
  cancel?: string | null
}): boolean {
  if (params.cancel === 'true' || params.cancel === '1') return true
  const status = String(params.status || '').toUpperCase()
  return status === 'CANCELLED' || status === 'CANCEL'
}
