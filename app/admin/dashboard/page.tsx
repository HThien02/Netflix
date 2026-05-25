'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { mockUsers, mockInvoices, mockSubscriptions, mockSupportTickets, mockProducts } from '@/lib/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils/format'
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
import { Users, DollarSign, TrendingUp, AlertCircle, ShoppingBag, MessageSquare } from 'lucide-react'

export default function AdminDashboardPage() {
  const { currentUser } = useApp()

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">Access denied. Admin account required.</p>
          <Link href="/" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Back Home
          </Link>
        </div>
      </AppLayout>
    )
  }

  const stats = useMemo(() => {
    const paidInvoices = mockInvoices.filter(i => i.status === 'paid')
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0)
    const activeSubscriptions = mockSubscriptions.filter(s => s.status === 'active').length
    const openTickets = mockSupportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
    
    return {
      totalRevenue,
      totalUsers: mockUsers.length,
      activeSubscriptions,
      totalOrders: mockInvoices.length,
      avgOrderValue: totalRevenue / paidInvoices.length,
      openTickets,
    }
  }, [])

  const chartData = [
    { name: 'Jan', revenue: 8000, users: 45, orders: 120 },
    { name: 'Feb', revenue: 12000, users: 68, orders: 200 },
    { name: 'Mar', revenue: 9800, users: 54, orders: 150 },
    { name: 'Apr', revenue: 15000, users: 92, orders: 280 },
    { name: 'May', revenue: 18000, users: 110, orders: 320 },
    { name: 'Jun', revenue: 22000, users: 135, orders: 380 },
  ]

  const userDistribution = [
    { name: 'Customers', value: mockUsers.filter(u => u.role === 'customer').length, color: '#3b82f6' },
    { name: 'Merchants', value: mockUsers.filter(u => u.role === 'merchant').length, color: '#10b981' },
    { name: 'Admins', value: mockUsers.filter(u => u.role === 'admin').length, color: '#8b5cf6' },
  ]

  const invoiceStatusData = [
    { name: 'Paid', value: mockInvoices.filter(i => i.status === 'paid').length, color: '#10b981' },
    { name: 'Pending', value: mockInvoices.filter(i => i.status === 'pending').length, color: '#f59e0b' },
    { name: 'Failed', value: mockInvoices.filter(i => i.status === 'failed').length, color: '#ef4444' },
  ]

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Platform overview and analytics</p>
          </motion.div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-12">
            {[
              { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), color: 'green' },
              { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'blue' },
              { icon: TrendingUp, label: 'Active Subscriptions', value: stats.activeSubscriptions, color: 'purple' },
              { icon: ShoppingBag, label: 'Total Orders', value: stats.totalOrders, color: 'pink' },
              { icon: AlertCircle, label: 'Avg Order Value', value: formatCurrency(stats.avgOrderValue), color: 'yellow' },
              { icon: MessageSquare, label: 'Open Tickets', value: stats.openTickets, color: 'red' },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-dark rounded-2xl p-6 border border-white/10"
                >
                  <div className={`p-2 rounded-lg w-fit mb-3 ${
                    stat.color === 'green' && 'bg-green-500/20' ||
                    stat.color === 'blue' && 'bg-blue-500/20' ||
                    stat.color === 'purple' && 'bg-purple-500/20' ||
                    stat.color === 'pink' && 'bg-pink-500/20' ||
                    stat.color === 'yellow' && 'bg-yellow-500/20' ||
                    stat.color === 'red' && 'bg-red-500/20'
                  }`}>
                    <Icon size={20} className={
                      stat.color === 'green' && 'text-green-400' ||
                      stat.color === 'blue' && 'text-blue-400' ||
                      stat.color === 'purple' && 'text-purple-400' ||
                      stat.color === 'pink' && 'text-pink-400' ||
                      stat.color === 'yellow' && 'text-yellow-400' ||
                      stat.color === 'red' && 'text-red-400'
                    } />
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                  <p className="text-white font-bold text-lg">{stat.value}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Revenue & Orders Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Revenue & Orders Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis stroke="#808080" />
                  <YAxis stroke="#808080" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #E50914' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#E50914" name="Revenue ($)" dot={{ fill: '#E50914' }} />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" name="Orders" dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* User Growth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">User Growth</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis stroke="#808080" />
                  <YAxis stroke="#808080" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #E50914' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="users" fill="#3b82f6" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* User Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">User Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Invoice Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Invoice Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Recent Orders</h2>
              <div className="space-y-3">
                {mockInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold text-sm">{invoice.id}</p>
                      <p className="text-gray-400 text-xs">{formatDate(invoice.invoiceDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{formatCurrency(invoice.totalAmount)}</p>
                      <div className={`text-xs font-semibold px-2 py-1 rounded w-fit ${
                        invoice.status === 'paid' && 'bg-green-500/20 text-green-400' ||
                        invoice.status === 'pending' && 'bg-yellow-500/20 text-yellow-400' ||
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Top Products</h2>
              <div className="space-y-3">
                {mockProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-netflix-red/20 flex items-center justify-center">
                        <span className="text-netflix-red font-bold text-xs">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{product.name}</p>
                      </div>
                    </div>
                    <p className="text-white font-bold text-sm">{formatCurrency(product.basePrice)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {[
              { label: 'Users Management', href: '/admin/users', color: 'blue' },
              { label: 'Products', href: '/admin/products', color: 'green' },
              { label: 'Support Tickets', href: '/admin/tickets', color: 'purple' },
              { label: 'Settings', href: '/admin/settings', color: 'red' },
            ].map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.05 }}
              >
                <Link
                  href={action.href}
                  className={`block p-6 rounded-2xl border text-center font-semibold transition-all ${
                    action.color === 'blue' && 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:border-blue-500/50' ||
                    action.color === 'green' && 'bg-green-500/10 border-green-500/30 text-green-400 hover:border-green-500/50' ||
                    action.color === 'purple' && 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:border-purple-500/50' ||
                    action.color === 'red' && 'bg-red-500/10 border-red-500/30 text-red-400 hover:border-red-500/50'
                  }`}
                >
                  {action.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
