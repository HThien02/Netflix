'use client'

import React, { useEffect, useState } from 'react'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatCurrency } from '@/lib/utils/format'
import { Loader2, Landmark } from 'lucide-react'

type OrderRow = {
  paymentCode: string
  amountVnd: number
  status: string
  sepayTransactionId: number | null
  createdAt: string
}

type Txn = {
  id: string
  date: string
  amountIn: number
  content: string
  paymentCode: string | null
}

export function UserSepayStats() {
  const { language } = useApp()
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/payments/sepay/my-transactions?days=90', {
          credentials: 'same-origin',
        })
        const data = await res.json()
        if (cancelled || !res.ok) return
        setConfigured(Boolean(data.configured))
        setOrders(data.orders || [])
        setTransactions(data.bankTransactions || [])
        setTotalPaid(data.summary?.totalIncoming ?? 0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-6 justify-center">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">{t('sepayStats.loading', language)}</span>
      </div>
    )
  }

  if (orders.length === 0) {
    return null
  }

  return (
    <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="text-netflix-red" size={22} />
        <h2 className="text-lg font-semibold text-white">{t('sepayStats.title', language)}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-gray-500 text-xs">{t('sepayStats.totalPaid', language)}</p>
          <p className="text-white text-xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-gray-500 text-xs">{t('sepayStats.orders', language)}</p>
          <p className="text-white text-xl font-bold mt-1">
            {orders.filter((o) => o.status === 'completed').length}
          </p>
        </div>
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-gray-500 text-xs">{t('sepayStats.pending', language)}</p>
          <p className="text-white text-xl font-bold mt-1">
            {orders.filter((o) => o.status === 'pending').length}
          </p>
        </div>
      </div>

      {!configured && (
        <p className="text-gray-500 text-xs mb-4">{t('sepayStats.dbOnly', language)}</p>
      )}

      {configured && transactions.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs mb-2">{t('sepayStats.bankTx', language)}</p>
          {transactions.slice(0, 10).map((tx) => (
            <div
              key={tx.id}
              className="flex flex-wrap justify-between gap-2 p-3 bg-black/30 rounded-lg text-sm"
            >
              <div>
                <span className="text-green-400 font-medium">+{formatCurrency(tx.amountIn)}</span>
                {tx.paymentCode && (
                  <span className="ml-2 font-mono text-xs text-netflix-red">{tx.paymentCode}</span>
                )}
                <p className="text-gray-500 text-xs mt-0.5 truncate max-w-md">{tx.content}</p>
              </div>
              <span className="text-gray-500 text-xs whitespace-nowrap">{tx.date}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <p className="text-gray-400 text-xs">{t('sepayStats.yourCodes', language)}</p>
        {orders.slice(0, 8).map((o) => (
          <div
            key={o.paymentCode}
            className="flex justify-between items-center text-sm p-2 rounded-lg bg-black/20"
          >
            <span className="font-mono text-gray-300">{o.paymentCode}</span>
            <span
              className={
                o.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
              }
            >
              {o.status === 'completed'
                ? t('sepayStats.paid', language)
                : t('sepayStats.waiting', language)}{' '}
              · {formatCurrency(o.amountVnd)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
