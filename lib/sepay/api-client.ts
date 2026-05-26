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

export type SepayListResult = {
  transactions: SepayApiTransaction[]
  error?: string
  httpStatus?: number
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

function formatDateTo(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 23:59:59`
}

async function fetchSepayPage(
  token: string,
  params: URLSearchParams,
): Promise<{ rows: SepayApiTransaction[]; hasMore: boolean; error?: string; httpStatus?: number }> {
  const res = await fetch(`${SEPAY_API_V2}/transactions?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      rows: [],
      hasMore: false,
      httpStatus: res.status,
      error: `SePay API HTTP ${res.status}${text ? `: ${text.slice(0, 180)}` : ''}`,
    }
  }

  const body = (await res.json()) as {
    status?: string
    message?: string
    data?: Record<string, unknown>[]
    meta?: { pagination?: { has_more?: boolean } }
  }

  if (body.status !== 'success' || !Array.isArray(body.data)) {
    return {
      rows: [],
      hasMore: false,
      error: body.message || 'SePay API trả về dữ liệu không hợp lệ',
    }
  }

  return {
    rows: body.data.map(mapV2Row),
    hasMore: Boolean(body.meta?.pagination?.has_more),
  }
}

async function listSepayTransactionsV2(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  transactionDateTo?: string
  amountIn?: number
  searchQuery?: string
}): Promise<SepayListResult> {
  const token = process.env.SEPAY_API_TOKEN?.trim()
  if (!token) return { transactions: [], error: 'SEPAY_API_TOKEN chưa cấu hình' }

  const targetLimit = Math.min(options.limit ?? 100, 500)
  const perPage = 100
  const account = options.accountNumber || process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim()

  const dateFrom = options.transactionDateMin?.slice(0, 10) || undefined
  const dateTo =
    options.transactionDateTo?.slice(0, 10) ||
    formatDateTo(new Date()).slice(0, 10)

  const runQuery = async (withAccount: boolean) => {
    const all: SepayApiTransaction[] = []
    let page = 1
    let lastError: string | undefined

    while (all.length < targetLimit) {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      })
      if (withAccount && account) params.set('account_number', account)
      if (dateFrom) params.set('transaction_date_from', `${dateFrom} 00:00:00`)
      if (dateTo) params.set('transaction_date_to', `${dateTo} 23:59:59`)
      if (options.searchQuery) {
        params.set('q', options.searchQuery)
      } else if (options.amountIn != null && options.amountIn > 0) {
        params.set('amount_in_min', String(Math.round(options.amountIn)))
        params.set('amount_in_max', String(Math.round(options.amountIn)))
      }

      const result = await fetchSepayPage(token, params)
      if (result.error && all.length === 0) {
        lastError = result.error
        break
      }
      all.push(...result.rows)
      if (!result.hasMore || result.rows.length === 0) break
      page += 1
      if (page > 20) break
    }

    return { transactions: all.slice(0, targetLimit), error: lastError }
  }

  let result = await runQuery(Boolean(account))
  if (result.transactions.length === 0 && account && !result.error) {
    result = await runQuery(false)
  }
  if (result.transactions.length === 0 && account && result.error) {
    const fallback = await runQuery(false)
    if (fallback.transactions.length > 0) return fallback
  }

  return result
}

export async function listSepayTransactions(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  transactionDateTo?: string
  amountIn?: number
  searchQuery?: string
}): Promise<SepayApiTransaction[]> {
  if (!isSepayApiConfigured()) return []
  const result = await listSepayTransactionsV2(options)
  if (result.error) {
    console.error('[sepay]', result.error)
  }
  return result.transactions
}

/** Giống listSepayTransactions nhưng trả lỗi API (cho admin UI) */
export async function listSepayTransactionsDetailed(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  transactionDateTo?: string
  amountIn?: number
  searchQuery?: string
}): Promise<SepayListResult> {
  if (!isSepayApiConfigured()) {
    return { transactions: [], error: 'SEPAY_API_TOKEN chưa cấu hình' }
  }
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
