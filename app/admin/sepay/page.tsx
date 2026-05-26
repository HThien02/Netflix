'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AdminShell, adminFetch } from '@/components/admin/admin-shell'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatCurrency } from '@/lib/utils/format'
import { Loader2, ArrowDownLeft, ArrowUpRight, RefreshCw, AlertTriangle } from 'lucide-react'

type Txn = {
  id: string
  date: string
  amountIn: number
  amountOut: number
  content: string
  paymentCode: string | null
  referenceNumber: string | null
}

type Summary = {
  totalIncoming: number
  totalOutgoing: number
  countIncoming: number
  countOutgoing: number
  count: number
}

type DbSummary = {
  totalIncoming: number
  countIncoming: number
  countPending: number
  orderCount: number
}

export default function AdminSepayPage() {
  const { currentUser, language } = useApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')
  const [configured, setConfigured] = useState(false)
  const [days, setDays] = useState(30)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [dbSummary, setDbSummary] = useState<DbSummary | null>(null)
  const [transactions, setTransactions] = useState<Txn[]>([])

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError('')
    setApiError('')
    try {
      const res = await adminFetch(`/api/admin/sepay/transactions?days=${days}&limit=300`, currentUser.id)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load')
      }
      setConfigured(Boolean(data.configured))
      setSummary(data.summary)
      setDbSummary(data.dbSummary || null)
      setTransactions(data.transactions || [])
      if (data.apiError) setApiError(data.apiError)
      if (!data.configured && data.error) setError(data.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [currentUser, days])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('admin.sepayTitle', language)}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.sepayDesc', language)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value={7}>7 {language === 'vi' ? 'ngày' : 'days'}</option>
            <option value={30}>30 {language === 'vi' ? 'ngày' : 'days'}</option>
            <option value={90}>90 {language === 'vi' ? 'ngày' : 'days'}</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15 text-sm"
          >
            <RefreshCw size={16} />
            {t('admin.sepayRefresh', language)}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin text-netflix-red" size={36} />
        </div>
      )}

      {error && !loading && (
        <div className="glass-dark rounded-xl p-6 border border-red-500/30 text-red-400 mb-6">
          {error}
        </div>
      )}

      {apiError && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm mb-6">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t('admin.sepayApiWarning', language)}</p>
            <p className="text-amber-200/80 mt-1">{apiError}</p>
            {dbSummary && (
              <p className="text-amber-200/70 mt-2">{t('admin.sepayDbFallback', language)}</p>
            )}
          </div>
        </div>
      )}

      {!loading && summary && (
        <>
          {dbSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard
                label={t('admin.sepayDbOrders', language)}
                value={String(dbSummary.orderCount)}
              />
              <StatCard
                label={t('admin.sepayDbCompleted', language)}
                value={String(dbSummary.countIncoming)}
              />
              <StatCard
                label={t('admin.sepayDbPending', language)}
                value={String(dbSummary.countPending)}
              />
              <StatCard
                label={t('admin.sepayDbTotal', language)}
                value={formatCurrency(dbSummary.totalIncoming)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<ArrowDownLeft className="text-green-400" size={22} />}
              label={t('admin.sepayTotalIn', language)}
              value={formatCurrency(summary.totalIncoming)}
              sub={
                configured
                  ? `${summary.countIncoming} GD (API)`
                  : t('admin.sepayDbOnly', language)
              }
            />
            <StatCard
              icon={<ArrowUpRight className="text-amber-400" size={22} />}
              label={t('admin.sepayTotalOut', language)}
              value={formatCurrency(summary.totalOutgoing)}
              sub={`${summary.countOutgoing} GD`}
            />
            <StatCard label={t('admin.sepayTxnCount', language)} value={String(summary.count)} />
            <StatCard
              label={t('admin.sepayNet', language)}
              value={formatCurrency(summary.totalIncoming - summary.totalOutgoing)}
            />
          </div>

          <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10 text-left">
                    <th className="p-4 font-medium">{t('admin.sepayColDate', language)}</th>
                    <th className="p-4 font-medium">{t('admin.sepayColAmount', language)}</th>
                    <th className="p-4 font-medium">{t('admin.sepayColCode', language)}</th>
                    <th className="p-4 font-medium">{t('admin.sepayColContent', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        {configured
                          ? t('admin.sepayEmpty', language)
                          : t('admin.sepayConfigureToken', language)}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="p-4 text-gray-300 whitespace-nowrap">{tx.date}</td>
                        <td className="p-4 whitespace-nowrap">
                          {tx.amountIn > 0 && (
                            <span className="text-green-400 font-medium">
                              +{formatCurrency(tx.amountIn)}
                            </span>
                          )}
                          {tx.amountOut > 0 && (
                            <span className="text-amber-400 font-medium">
                              -{formatCurrency(tx.amountOut)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-netflix-red text-xs">
                          {tx.paymentCode || '—'}
                        </td>
                        <td className="p-4 text-gray-400 max-w-md truncate" title={tx.content}>
                          {tx.content || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="glass-dark rounded-xl p-5 border border-white/10">
      {icon && <div className="mb-2">{icon}</div>}
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}
