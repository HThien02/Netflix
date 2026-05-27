'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AdminShell, adminFetch } from '@/components/admin/admin-shell'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { invoiceStatusLabel } from '@/lib/invoices/display'
import { supportStatusLabel } from '@/lib/support/status-labels'
import type { SupportTicket } from '@/lib/types'
import { motion } from 'framer-motion'
import {
  Users,
  KeyRound,
  DollarSign,
  MessageSquare,
  Clock,
  Package,
  Database,
  Loader2,
  ArrowRight,
  Landmark,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type DashboardStats = {
  customers: number
  activeRentals: number
  revenueThisMonth: number
  revenueTotal: number
  sepayRevenueExtra: number
  openTickets: number
  sepayPending: number
  productsActive: number
  poolSlotsFree: number
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  recentOrders: Array<{
    id: string
    invoiceNumber: string | null
    amount: number
    status: string
    paymentMethod: string
    createdAt: string
    userEmail: string | null
    userName: string | null
  }>
  recentTickets: Array<{
    id: string
    subject: string
    status: string
    priority: string
    createdAt: string
    userEmail: string | null
    userName: string | null
  }>
}

function mapInvoiceStatus(status: string): string {
  if (status === 'completed') return 'paid'
  return status
}

function formatMonthLabel(monthKey: string, language: 'vi' | 'en') {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1, 1)
  return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    year: '2-digit',
  })
}

export default function AdminDashboardPage() {
  const { currentUser, language } = useApp()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/dashboard', currentUser.id)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setStats(data.stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    void load()
  }, [load])

  const chartData = useMemo(() => {
    if (!stats) return []
    return stats.monthlyRevenue.map((row) => ({
      name: formatMonthLabel(row.month, language),
      revenue: row.revenue,
      orders: row.orders,
    }))
  }, [stats, language])

  const quickLinks = [
    { href: '/admin/products', labelKey: 'admin.productsManage', icon: Package },
    { href: '/admin/pool', labelKey: 'admin.pool', icon: Database },
    { href: '/admin/rentals', labelKey: 'admin.rentals', icon: KeyRound },
    { href: '/admin/support', labelKey: 'admin.support', icon: MessageSquare },
    { href: '/admin/sepay', labelKey: 'admin.sepay', icon: Landmark },
    { href: '/admin/ban-reasons', labelKey: 'admin.banReasons', icon: Users },
  ] as const

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('admin.title', language)}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {t('admin.dashboardSubtitle', language)}
          {currentUser?.fullName ? ` · ${currentUser.fullName}` : ''}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-netflix-red" size={40} />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 mb-6">
          {error}
        </div>
      )}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Users className="text-blue-400" size={22} />}
              label={t('admin.statCustomers', language)}
              value={String(stats.customers)}
            />
            <StatCard
              icon={<KeyRound className="text-green-400" size={22} />}
              label={t('admin.statActiveRentals', language)}
              value={String(stats.activeRentals)}
            />
            <StatCard
              icon={<DollarSign className="text-netflix-red" size={22} />}
              label={t('admin.statRevenueMonth', language)}
              value={formatCurrency(stats.revenueThisMonth)}
              sub={
                stats.sepayRevenueExtra > 0
                  ? `${t('admin.statRevenueTotal', language).replace(
                      '{amount}',
                      formatCurrency(stats.revenueTotal),
                    )} · ${t('admin.statRevenueSepayExtra', language).replace(
                      '{amount}',
                      formatCurrency(stats.sepayRevenueExtra),
                    )}`
                  : t('admin.statRevenueTotal', language).replace(
                      '{amount}',
                      formatCurrency(stats.revenueTotal),
                    )
              }
            />
            <StatCard
              icon={<MessageSquare className="text-amber-400" size={22} />}
              label={t('admin.statOpenTickets', language)}
              value={String(stats.openTickets)}
              highlight={stats.openTickets > 0}
            />
            <StatCard
              icon={<Clock className="text-yellow-400" size={22} />}
              label={t('admin.statSepayPending', language)}
              value={String(stats.sepayPending)}
              highlight={stats.sepayPending > 0}
            />
            <StatCard
              icon={<Package className="text-purple-400" size={22} />}
              label={t('admin.statProducts', language)}
              value={String(stats.productsActive)}
            />
            <StatCard
              icon={<Database className="text-cyan-400" size={22} />}
              label={t('admin.statPoolSlotsFree', language)}
              value={String(stats.poolSlotsFree)}
            />
          </div>

          {chartData.some((d) => d.revenue > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-6 border border-white/10 mb-8"
            >
              <h2 className="text-lg font-bold text-white mb-4">
                {t('admin.revenueChartTitle', language)}
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue'
                        ? t('admin.revenue', language)
                        : t('admin.orders', language),
                    ]}
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #333' }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#E50914"
                    name="revenue"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <section className="glass-dark rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  {t('admin.recentOrders', language)}
                </h2>
                <Link
                  href="/admin/sepay"
                  className="text-netflix-red text-sm hover:underline inline-flex items-center gap-1"
                >
                  SePay <ArrowRight size={14} />
                </Link>
              </div>
              {stats.recentOrders.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('admin.noRecentOrders', language)}</p>
              ) : (
                <ul className="space-y-3">
                  {stats.recentOrders.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap justify-between gap-2 p-3 rounded-lg bg-black/30 border border-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-mono text-sm">
                          {order.invoiceNumber || order.id.slice(0, 8)}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {order.userName || order.userEmail || '—'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {formatDateTime(order.createdAt, language)} · {order.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{formatCurrency(order.amount)}</p>
                        <p className="text-xs text-gray-400">
                          {invoiceStatusLabel(mapInvoiceStatus(order.status), language)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="glass-dark rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  {t('admin.recentTickets', language)}
                </h2>
                <Link
                  href="/admin/support"
                  className="text-netflix-red text-sm hover:underline inline-flex items-center gap-1"
                >
                  {t('admin.viewAll', language)} <ArrowRight size={14} />
                </Link>
              </div>
              {stats.recentTickets.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('admin.noOpenTickets', language)}</p>
              ) : (
                <ul className="space-y-3">
                  {stats.recentTickets.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        href="/admin/support"
                        className="block p-3 rounded-lg bg-black/30 border border-white/5 hover:border-netflix-red/40 transition-colors"
                      >
                        <p className="text-white font-medium text-sm truncate">{ticket.subject}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {ticket.userName || ticket.userEmail || '—'} ·{' '}
                          {formatDateTime(ticket.createdAt, language)}
                        </p>
                        <span className="inline-block mt-1 text-xs text-amber-400">
                          {supportStatusLabel(ticket.status as SupportTicket['status'], language)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              {t('admin.quickActions', language)}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickLinks.map(({ href, labelKey, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="glass-dark rounded-xl p-4 border border-white/10 hover:border-netflix-red/50 transition-colors text-center group"
                >
                  <Icon
                    size={22}
                    className="mx-auto mb-2 text-gray-400 group-hover:text-netflix-red"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white">
                    {t(labelKey, language)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
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
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`glass-dark rounded-xl p-4 border ${
        highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10'
      }`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}
