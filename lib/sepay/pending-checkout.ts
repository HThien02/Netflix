import type { Cart } from '@/lib/types'

export const SEPAY_PENDING_KEY = 'sepay_pending_checkout'

export type SepayClientPending = {
  cart: Cart
  productNames: Record<string, string>
  paymentCode?: string
  amountVnd?: number
  qrImageUrl?: string
  bank?: {
    bankBin: string
    bankName: string
    accountNumber: string
    accountName: string
  }
}

export function saveSepayPendingCheckout(cart: Cart, productNames: Record<string, string>) {
  const raw = JSON.stringify({ cart, productNames })
  sessionStorage.setItem(SEPAY_PENDING_KEY, raw)
  try {
    localStorage.setItem(SEPAY_PENDING_KEY, raw)
  } catch {
    /* ignore */
  }
}

export function saveSepayPaymentDetails(
  paymentCode: string,
  amountVnd: number,
  extras?: Pick<SepayClientPending, 'qrImageUrl' | 'bank'>,
) {
  const existing = loadSepayPendingCheckout()
  if (!existing?.cart) return
  const raw = JSON.stringify({
    ...existing,
    paymentCode,
    amountVnd,
    ...extras,
  })
  sessionStorage.setItem(SEPAY_PENDING_KEY, raw)
  try {
    localStorage.setItem(SEPAY_PENDING_KEY, raw)
  } catch {
    /* ignore */
  }
}

export function loadSepayPendingCheckout(): SepayClientPending | null {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(SEPAY_PENDING_KEY)
      if (raw) return JSON.parse(raw) as SepayClientPending
    } catch {
      /* ignore */
    }
  }
  return null
}

export function clearSepayPendingCheckout() {
  sessionStorage.removeItem(SEPAY_PENDING_KEY)
  try {
    localStorage.removeItem(SEPAY_PENDING_KEY)
  } catch {
    /* ignore */
  }
}
