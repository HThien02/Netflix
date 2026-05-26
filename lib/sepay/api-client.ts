/** SePay API v1 — https://developer.sepay.vn/en/sepay-api/v1/api-giao-dich */

const SEPAY_API_BASE = 'https://my.sepay.vn'

export type SepayApiTransaction = {
  id: string
  bank_brand_name?: string
  account_number?: string
  transaction_date?: string
  amount_in?: string
  amount_out?: string
  transaction_content?: string
  code?: string | null
  reference_number?: string
}

export function isSepayApiConfigured(): boolean {
  return Boolean(process.env.SEPAY_API_TOKEN?.trim())
}

export async function listSepayTransactions(options: {
  accountNumber?: string
  limit?: number
  transactionDateMin?: string
  transactionDateMax?: string
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
  if (options.transactionDateMax) params.set('transaction_date_max', options.transactionDateMax)
  if (options.amountIn != null && options.amountIn > 0) {
    params.set('amount_in', String(Math.round(options.amountIn)))
  }

  const url = `${SEPAY_API_BASE}/userapi/transactions/list?${params.toString()}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.warn('[sepay api] list failed', res.status, await res.text().catch(() => ''))
    return []
  }

  const body = (await res.json()) as {
    transactions?: SepayApiTransaction[]
    error?: string | null
  }

  if (body.error) {
    console.warn('[sepay api] list error', body.error)
    return []
  }

  return body.transactions ?? []
}

/** Chỉ giao dịch tiền vào */
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
