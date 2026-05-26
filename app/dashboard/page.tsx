'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { UserDataGate } from '@/components/user-data-gate'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { invoiceStatusLabel } from '@/lib/invoices/display'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, DollarSign, ShoppingBag, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const { currentUser, userSubscriptions, userInvoices, language, isAuthenticated } = useApp()

  if (!isAuthenticated || !currentUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">Please sign in to view your dashboard</p>
          <Link href="/auth/login" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Sign In
          </Link>
        </div>
      </AppLayout>
    )
  }

  // Calculate stats
  const stats = useMemo(() => {
    const activeCount = userSubscriptions.filter(s => s.status === 'active').length
    const totalSpent = userInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0)
    const avgOrderValue = userInvoices.length > 0 ? totalSpent / userInvoices.length : 0
    const thisMonth = userInvoices.filter(i => {
      const invoiceDate = new Date(i.invoiceDate)
      const now = new Date()
      return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
    })

    return {
      activeSubscriptions: activeCount,
      totalSpent,
      avgOrderValue,
      thisMonthSpent: thisMonth.reduce((sum, i) => sum + i.totalAmount, 0),
      paidInvoices: userInvoices.filter(i => i.status === 'paid').length,
    }
  }, [userSubscriptions, userInvoices])

  // Prepare chart data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map((month, index) => ({
      name: month,
      spending: Math.random() * 200 + 50,
      subscriptions: Math.floor(Math.random() * 5) + 1,
    }))
  }, [])

  const invoiceStatus = useMemo(() => {
    return [
      { name: 'Paid', value: userInvoices.filter(i => i.status === 'paid').length, color: '#10b981' },
      { name: 'Pending', value: userInvoices.filter(i => i.status === 'pending').length, color: '#f59e0b' },
      { name: 'Failed', value: userInvoices.filter(i => i.status === 'failed').length, color: '#ef4444' },
    ]
  }, [userInvoices])

  return (
    <AppLayout>
      <UserDataGate>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              {t('dashboard.welcome', language)}, {currentUser.fullName}!
            </h1>
            <p className="text-gray-400">Here&apos;s your subscription overview</p>
          </motion.div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: TrendingUp,
                label: 'Active Subscriptions',
                value: stats.activeSubscriptions,
                color: 'green',
              },
              {
                icon: DollarSign,
                label: 'Total Spent',
                value: formatCurrency(stats.totalSpent),
                color: 'blue',
              },
              {
                icon: ShoppingBag,
                label: 'Orders This Month',
                value: userInvoices.filter(i => {
                  const invoiceDate = new Date(i.invoiceDate)
                  const now = new Date()
                  return invoiceDate.getMonth() === now.getMonth()
                }).length,
                color: 'purple',
              },
              {
                icon: Calendar,
                label: 'Avg Order Value',
                value: formatCurrency(stats.avgOrderValue),
                color: 'red',
              },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-dark rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${
                      stat.color === 'green' && 'bg-green-500/20' ||
                      stat.color === 'blue' && 'bg-blue-500/20' ||
                      stat.color === 'purple' && 'bg-purple-500/20' ||
                      stat.color === 'red' && 'bg-netflix-red/20'
                    }`}>
                      <Icon size={24} className={
                        stat.color === 'green' && 'text-green-400' ||
                        stat.color === 'blue' && 'text-blue-400' ||
                        stat.color === 'purple' && 'text-purple-400' ||
                        stat.color === 'red' && 'text-netflix-red'
                      } />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                  <p className="text-white font-bold text-2xl">{stat.value}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Spending Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Spending Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis stroke="#808080" />
                  <YAxis stroke="#808080" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #E50914' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="spending"
                    stroke="#E50914"
                    dot={{ fill: '#E50914' }}
                    name="Spending (VND)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Invoice Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Invoice Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Recent Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-dark rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Invoices</h2>
              <Link href="/subscriptions" className="text-netflix-red hover:text-red-400 text-sm font-semibold">
                {t('dashboard.viewAll', language)} →
              </Link>
            </div>

            <div className="space-y-3">
              {userInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div>
                    <p className="text-white font-semibold">{invoice.id}</p>
                    <p className="text-gray-400 text-sm">{formatDate(invoice.invoiceDate, language)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(invoice.totalAmount)}</p>
                    <div className={`text-xs font-semibold px-2 py-1 rounded w-fit ${
                      invoice.status === 'paid' && 'bg-green-500/20 text-green-400' ||
                      invoice.status === 'pending' && 'bg-yellow-500/20 text-yellow-400' ||
                      invoice.status === 'failed' && 'bg-red-500/20 text-red-400' ||
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {invoiceStatusLabel(invoice.status, language)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { label: 'View Subscriptions', href: '/subscriptions', color: 'blue' },
              { label: 'Browse Plans', href: '/marketplace', color: 'green' },
              { label: 'Account Settings', href: '/profile', color: 'purple' },
            ].map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Link
                  href={action.href}
                  className={`block p-6 rounded-2xl border text-center font-semibold transition-all ${
                    action.color === 'blue' && 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:border-blue-500/50' ||
                    action.color === 'green' && 'bg-green-500/10 border-green-500/30 text-green-400 hover:border-green-500/50' ||
                    action.color === 'purple' && 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:border-purple-500/50'
                  }`}
                >
                  {action.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      </UserDataGate>
    </AppLayout>
  )
}
