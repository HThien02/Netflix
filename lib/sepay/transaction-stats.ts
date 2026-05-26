import type { SepayApiTransaction } from '@/lib/sepay/api-client'
import { extractPaymentCodeFromWebhook } from '@/lib/sepay/client'

export type SepayTxnView = {
  id: string
  date: string
  amountIn: number
  amountOut: number
  content: string
  code: string | null
  paymentCode: string | null
  referenceNumber: string | null
  accountNumber: string
  bankName: string
}

export function toSepayTxnView(tx: SepayApiTransaction): SepayTxnView {
  const content = String(tx.transaction_content || '')
  const code = tx.code?.trim() || null
  const paymentCode =
    extractPaymentCodeFromWebhook({ code, content, description: content }) ||
    (code && /^[A-Z]{2}[A-Z0-9]+$/i.test(code) ? code.toUpperCase() : null)

  return {
    id: String(tx.id),
    date: String(tx.transaction_date || ''),
    amountIn: Math.round(Number(tx.amount_in ?? 0)),
    amountOut: Math.round(Number(tx.amount_out ?? 0)),
    content,
    code,
    paymentCode,
    referenceNumber: tx.reference_number ?? null,
    accountNumber: String(tx.account_number || ''),
    bankName: String(tx.bank_brand_name || ''),
  }
}

export type SepayTxnSummary = {
  totalIncoming: number
  totalOutgoing: number
  countIncoming: number
  countOutgoing: number
  count: number
}

export function summarizeSepayTransactions(txs: SepayTxnView[]): SepayTxnSummary {
  let totalIncoming = 0
  let totalOutgoing = 0
  let countIncoming = 0
  let countOutgoing = 0

  for (const tx of txs) {
    if (tx.amountIn > 0) {
      totalIncoming += tx.amountIn
      countIncoming += 1
    }
    if (tx.amountOut > 0) {
      totalOutgoing += tx.amountOut
      countOutgoing += 1
    }
  }

  return {
    totalIncoming,
    totalOutgoing,
    countIncoming,
    countOutgoing,
    count: txs.length,
  }
}

export function dateMinDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00`
}
