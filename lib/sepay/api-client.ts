/** SePay API production — https://userapi.sepay.vn/v2 */

import { normalizeSepayTransactionStorageId } from '@/lib/sepay/transaction-id'
import { dateMinDaysAgo } from '@/lib/sepay/transaction-stats'

const SEPAY_API_V2 = 'https://userapi.sepay.vn/v2'

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

export function isSepayApiConfigured(): boolean {
  return Boolean(process.env.SEPAY_API_TOKEN?.trim())
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
  searchQuery?: string
}): Promise<SepayApiTransaction[]> {
  const token = process.env.SEPAY_API_TOKEN?.trim()
  if (!token) return []

  const params = new URLSearchParams({
    per_page: String(Math.min(options.limit ?? 100, 100)),
  })
  const account = options.accountNumber || process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim()
  if (account) params.set('account_number', account)
  if (options.transactionDateMin) {
    params.set('transaction_date_from', options.transactionDateMin.slice(0, 10))
  }
  if (options.searchQuery) {
    params.set('q', options.searchQuery)
  } else if (options.amountIn != null && options.amountIn > 0) {
    params.set('amount_in_min', String(Math.round(options.amountIn)))
    params.set('amount_in_max', String(Math.round(options.amountIn)))
  }

  const res = await fetch(`${SEPAY_API_V2}/transactions?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) return []

  const body = (await res.json()) as { status?: string; data?: Record<string, unknown>[] }
  if (body.status !== 'success' || !Array.isArray(body.data)) return []
  return body.data.map(mapV2Row)
}

export async function listSepayTransactions(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  amountIn?: number
  searchQuery?: string
}): Promise<SepayApiTransaction[]> {
  if (!isSepayApiConfigured()) return []
  return listSepayTransactionsV2(options)
}

export async function findSepayTransactionsByPaymentCode(
  paymentCode: string,
  accountNumber?: string,
): Promise<SepayApiTransaction[]> {
  const account = accountNumber || process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim()
  const fromSearch = await listSepayTransactions({
    accountNumber: account,
    searchQuery: paymentCode,
    limit: 20,
  })
  if (fromSearch.length > 0) return fromSearch.filter((tx) => Number(tx.amount_in ?? 0) > 0)

  return listSepayIncomingTransactions({
    accountNumber: account || '',
    limit: 80,
    transactionDateMin: dateMinDaysAgo(7),
  })
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
