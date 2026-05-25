'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { mockMerchants, mockProducts, mockSubscriptions } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils/format'
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
} from 'recharts'
import { TrendingUp, Package, ShoppingCart, DollarSign, Star, Users } from 'lucide-react'

export default function MerchantDashboardPage() {
  const { currentUser } = useApp()

  if (!currentUser || currentUser.role !== 'merchant') {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">Access denied. Merchant account required.</p>
          <Link href="/" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Back Home
          </Link>
        </div>
      </AppLayout>
    )
  }

  const merchant = mockMerchants.find(m => m.userId === currentUser.id) || mockMerchants[0]
  const merchantProducts = mockProducts.filter(p => p.merchantId === merchant.id)
  const merchantSubscriptions = mockSubscriptions.filter(s => 
    merchantProducts.some(p => p.id === s.productId)
  )

  const stats = useMemo(() => {
    return {
      totalRevenue: merchant.totalRevenue,
      totalSales: merchant.totalSales,
      activeProducts: merchantProducts.filter(p => p.active).length,
      activeSubscriptions: merchantSubscriptions.filter(s => s.status === 'active').length,
      avgRating: merchant.rating,
    }
  }, [merchant, merchantProducts, merchantSubscriptions])

  const chartData = [
    { name: 'Jan', revenue: 8000, sales: 120 },
    { name: 'Feb', revenue: 12000, sales: 200 },
    { name: 'Mar', revenue: 9800, sales: 150 },
    { name: 'Apr', revenue: 15000, sales: 280 },
    { name: 'May', revenue: 18000, sales: 320 },
    { name: 'Jun', revenue: 22000, sales: 380 },
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
            <h1 className="text-4xl font-bold text-white mb-2">Merchant Dashboard</h1>
            <p className="text-gray-400">Manage your store and subscriptions</p>
          </motion.div>

          {/* Store Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-2xl p-6 border border-white/10 mb-12 flex items-center justify-between"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{merchant.storeName}</h2>
              <p className="text-gray-400 max-w-xl mb-4">{merchant.description}</p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < Math.floor(merchant.rating) ? 'text-netflix-red' : 'text-gray-600'}>
                        ★
                      </span>
                    ))}
                    <span className="text-white font-bold">{merchant.rating}/5</span>
                  </div>
                </div>
                <div className="w-px h-12 bg-gray-600" />
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${merchant.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-white font-semibold">
                      {merchant.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
            {[
              { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), color: 'green' },
              { icon: ShoppingCart, label: 'Total Sales', value: stats.totalSales, color: 'blue' },
              { icon: Package, label: 'Active Products', value: stats.activeProducts, color: 'purple' },
              { icon: Users, label: 'Active Subscriptions', value: stats.activeSubscriptions, color: 'pink' },
              { icon: Star, label: 'Rating', value: `${stats.avgRating}/5`, color: 'yellow' },
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
                  <div className={`p-3 rounded-lg w-fit mb-4 ${
                    stat.color === 'green' && 'bg-green-500/20' ||
                    stat.color === 'blue' && 'bg-blue-500/20' ||
                    stat.color === 'purple' && 'bg-purple-500/20' ||
                    stat.color === 'pink' && 'bg-pink-500/20' ||
                    stat.color === 'yellow' && 'bg-yellow-500/20'
                  }`}>
                    <Icon size={24} className={
                      stat.color === 'green' && 'text-green-400' ||
                      stat.color === 'blue' && 'text-blue-400' ||
                      stat.color === 'purple' && 'text-purple-400' ||
                      stat.color === 'pink' && 'text-pink-400' ||
                      stat.color === 'yellow' && 'text-yellow-400'
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
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Revenue Trend</h2>
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
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#E50914"
                    dot={{ fill: '#E50914' }}
                    name="Revenue (VND)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Sales Volume */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Sales Volume</h2>
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
                  <Bar dataKey="sales" fill="#10b981" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Products & Subscriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Top Products</h2>
              <div className="space-y-4">
                {merchantProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-netflix-red/20 flex items-center justify-center">
                        <span className="text-netflix-red font-bold text-lg">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{product.name}</p>
                        <p className="text-gray-400 text-xs">{product.category}</p>
                      </div>
                    </div>
                    <p className="text-white font-bold">{formatCurrency(product.basePrice)}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Subscription Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-dark rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Subscription Status</h2>
              <div className="space-y-4">
                {[
                  { label: 'Active', value: merchantSubscriptions.filter(s => s.status === 'active').length, color: 'green' },
                  { label: 'Cancelled', value: merchantSubscriptions.filter(s => s.status === 'cancelled').length, color: 'red' },
                  { label: 'Expired', value: merchantSubscriptions.filter(s => s.status === 'expired').length, color: 'yellow' },
                  { label: 'Paused', value: merchantSubscriptions.filter(s => s.status === 'paused').length, color: 'gray' },
                ].map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.color === 'green' && 'bg-green-500' ||
                        status.color === 'red' && 'bg-red-500' ||
                        status.color === 'yellow' && 'bg-yellow-500' ||
                        'bg-gray-500'
                      }`} />
                      <p className="text-white font-semibold text-sm">{status.label}</p>
                    </div>
                    <p className="text-white font-bold text-lg">{status.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { label: 'Manage Products', href: '/merchant/products', color: 'blue' },
              { label: 'View Subscriptions', href: '/merchant/subscriptions', color: 'green' },
              { label: 'Payouts', href: '/merchant/payouts', color: 'purple' },
            ].map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
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
    </AppLayout>
  )
}
