import type { Cart } from '@/lib/types'

export const PAYOS_PENDING_KEY = 'payos_pending_checkout'

export type PayosPendingClient = {
  cart: Cart
  productNames: Record<string, string>
  orderCode: number
}

export function savePayosPendingCheckout(
  cart: Cart,
  productNames: Record<string, string>,
  orderCode: number,
) {
  if (typeof window === 'undefined') return
  const payload: PayosPendingClient = { cart, productNames, orderCode }
  const raw = JSON.stringify(payload)
  sessionStorage.setItem(PAYOS_PENDING_KEY, raw)
  try {
    localStorage.setItem(PAYOS_PENDING_KEY, raw)
  } catch {
    /* quota */
  }
}

export function loadPayosPendingCheckout(): PayosPendingClient | null {
  if (typeof window === 'undefined') return null
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(PAYOS_PENDING_KEY)
      if (raw) return JSON.parse(raw) as PayosPendingClient
    } catch {
      /* ignore */
    }
  }
  return null
}

export function clearPayosPendingCheckout() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PAYOS_PENDING_KEY)
  try {
    localStorage.removeItem(PAYOS_PENDING_KEY)
  } catch {
    /* ignore */
  }
}
