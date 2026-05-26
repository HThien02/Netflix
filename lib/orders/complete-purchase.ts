import type { Cart, PurchasedAccount, Invoice, Lang } from '@/lib/types'

export type CompletePurchaseResult = {
  invoice: Invoice
  accounts: PurchasedAccount[]
  savedToDb: boolean
}

export async function completePurchase(
  userId: string,
  cart: Cart,
  productNames: Record<string, string>,
  paymentMethod: 'payos' | 'sepay' | 'credit_card' | 'wallet',
  options?: { userEmail?: string; userName?: string; language?: Lang },
): Promise<CompletePurchaseResult> {
  const res = await fetch('/api/orders/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      cart,
      productNames,
      paymentMethod,
      userEmail: options?.userEmail,
      userName: options?.userName,
      language: options?.language || 'vi',
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Order failed')
  }

  const invoice = normalizeInvoice(data.invoice)
  const accounts = (data.accounts as PurchasedAccount[]).map(normalizeAccount)

  savePurchasedAccountsLocal(userId, accounts)
  saveInvoicesLocal(userId, invoice)

  return {
    invoice,
    accounts,
    savedToDb: Boolean(data.savedToDb),
  }
}

function normalizeInvoice(inv: Invoice): Invoice {
  return {
    ...inv,
    invoiceDate: new Date(inv.invoiceDate),
    dueDate: new Date(inv.dueDate),
    paidDate: inv.paidDate ? new Date(inv.paidDate) : undefined,
    createdAt: new Date(inv.createdAt),
    updatedAt: new Date(inv.updatedAt),
  }
}

function normalizeAccount(a: PurchasedAccount): PurchasedAccount {
  return {
    ...a,
    expiresAt: new Date(a.expiresAt),
    createdAt: new Date(a.createdAt),
  }
}

export function savePurchasedAccountsLocal(userId: string, newAccounts: PurchasedAccount[]) {
  const key = `purchasedAccounts_${userId}`
  const existing: PurchasedAccount[] = JSON.parse(localStorage.getItem(key) || '[]')
  const merged = [...newAccounts, ...existing].map((a) => ({
    ...a,
    expiresAt: new Date(a.expiresAt),
    createdAt: new Date(a.createdAt),
  }))
  localStorage.setItem(key, JSON.stringify(merged))
}

export function saveInvoicesLocal(userId: string, invoice: Invoice) {
  const key = `paymentHistory_${userId}`
  const existing: Invoice[] = JSON.parse(localStorage.getItem(key) || '[]')
  localStorage.setItem(key, JSON.stringify([invoice, ...existing]))
}

export function loadPurchasedAccountsLocal(userId: string): PurchasedAccount[] {
  const raw = localStorage.getItem(`purchasedAccounts_${userId}`)
  if (!raw) return []
  return JSON.parse(raw).map((a: PurchasedAccount) => ({
    ...a,
    expiresAt: new Date(a.expiresAt),
    createdAt: new Date(a.createdAt),
  }))
}

export function loadInvoicesLocal(userId: string): Invoice[] {
  const raw = localStorage.getItem(`paymentHistory_${userId}`)
  if (!raw) return []
  return JSON.parse(raw).map((inv: Invoice) => ({
    ...inv,
    invoiceDate: new Date(inv.invoiceDate),
    dueDate: new Date(inv.dueDate),
    paidDate: inv.paidDate ? new Date(inv.paidDate) : undefined,
    createdAt: new Date(inv.createdAt),
    updatedAt: new Date(inv.updatedAt),
  }))
}
