/** SePay API — v2 khuyến nghị; v1 fallback production */

import { normalizeSepayTransactionStorageId } from '@/lib/sepay/transaction-id'

export type SepayApiTransaction = {
  id: string
  bank_brand_name?: string
  account_number?: string
  transaction_date?: string
  amount_in?: string | number
  amount_out?: string | number
  transaction_content?: string
  code?: string | null
  reference_number?: string
}

type SepayApiMode = 'production' | 'sandbox'

function getSepayApiMode(): SepayApiMode {
  const mode = (process.env.SEPAY_API_MODE || 'production').trim().toLowerCase()
  return mode === 'sandbox' ? 'sandbox' : 'production'
}

function getSepayApiV2Base(): string {
  return getSepayApiMode() === 'sandbox'
    ? 'https://userapi-sandbox.sepay.vn/v2'
    : 'https://userapi.sepay.vn/v2'
}

export function isSepayApiConfigured(): boolean {
  return Boolean(process.env.SEPAY_API_TOKEN?.trim())
}

export function getSepayApiModeLabel(): SepayApiMode {
  return getSepayApiMode()
}

function mapV2Row(row: Record<string, unknown>): SepayApiTransaction {
  return {
    id: String(row.id ?? ''),
    bank_brand_name: String(row.bank_brand_name ?? ''),
    account_number: String(row.account_number ?? ''),
    transaction_date: String(row.transaction_date ?? ''),
    amount_in: row.amount_in as number | string | undefined,
    amount_out: row.amount_out as number | string | undefined,
    transaction_content: String(row.transaction_content ?? ''),
    code: row.code != null && row.code !== '' ? String(row.code) : null,
    reference_number: row.reference_number != null ? String(row.reference_number) : undefined,
  }
}

async function listSepayTransactionsV2(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  amountIn?: number
}): Promise<SepayApiTransaction[]> {
  const token = process.env.SEPAY_API_TOKEN?.trim()
  if (!token) return []

  const params = new URLSearchParams({
    per_page: String(Math.min(options.limit ?? 100, 100)),
  })
  const account = options.accountNumber || process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim()
  if (account) params.set('account_number', account)
  if (options.transactionDateMin) {
    const day = options.transactionDateMin.slice(0, 10)
    params.set('transaction_date_from', day)
  }
  if (options.amountIn != null && options.amountIn > 0) {
    params.set('amount_in_min', String(Math.round(options.amountIn)))
    params.set('amount_in_max', String(Math.round(options.amountIn)))
  }

  const url = `${getSepayApiV2Base()}/transactions?${params.toString()}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.warn('[sepay api v2] list failed', getSepayApiMode(), res.status, body.slice(0, 200))
    return []
  }

  const body = (await res.json()) as { status?: string; data?: Record<string, unknown>[] }
  if (body.status !== 'success' || !Array.isArray(body.data)) return []
  return body.data.map(mapV2Row)
}

/** v1 production only — khi v2 lỗi */
async function listSepayTransactionsV1(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  amountIn?: number
}): Promise<SepayApiTransaction[]> {
  const token = process.env.SEPAY_API_TOKEN?.trim()
  if (!token) return []

  const params = new URLSearchParams({
    limit: String(Math.min(options.limit ?? 100, 500)),
  })
  const account = options.accountNumber || process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim()
  if (account) params.set('account_number', account)
  if (options.transactionDateMin) params.set('transaction_date_min', options.transactionDateMin)
  if (options.amountIn != null && options.amountIn > 0) {
    params.set('amount_in', String(Math.round(options.amountIn)))
  }

  const url = `https://my.sepay.vn/userapi/transactions/list?${params.toString()}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.warn('[sepay api v1] list failed', res.status)
    return []
  }

  const body = (await res.json()) as {
    transactions?: SepayApiTransaction[]
    error?: string | null
  }
  if (body.error) return []
  return body.transactions ?? []
}

export async function listSepayTransactions(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  transactionDateMax?: string
  amountIn?: number
}): Promise<SepayApiTransaction[]> {
  if (!isSepayApiConfigured()) return []

  const v2 = await listSepayTransactionsV2(options)
  if (v2.length > 0 || getSepayApiMode() === 'sandbox') return v2

  return listSepayTransactionsV1(options)
}

export async function listSepayIncomingTransactions(options: {
  accountNumber: string
  amountInVnd?: number
  limit?: number
  transactionDateMin?: string
}): Promise<SepayApiTransaction[]> {
  const txs = await listSepayTransactions({
    accountNumber: options.accountNumber,
    amountIn: options.amountInVnd,
    limit: options.limit,
    transactionDateMin: options.transactionDateMin,
  })
  return txs.filter((tx) => Number(tx.amount_in ?? 0) > 0)
}

export { normalizeSepayTransactionStorageId }
