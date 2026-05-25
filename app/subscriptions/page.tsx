'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { mockProducts, mockSubscriptions } from '@/lib/mock-data'
import { Subscription } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react'

export default function SubscriptionsPage() {
  const { currentUser, userSubscriptions, language, isAuthenticated } = useApp()
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all')

  if (!isAuthenticated || !currentUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">Please sign in to view your subscriptions</p>
          <Link href="/auth/login" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Sign In
          </Link>
        </div>
      </AppLayout>
    )
  }

  const filteredSubs = useMemo(() => {
    if (filter === 'all') return userSubscriptions
    return userSubscriptions.filter(sub => sub.status === filter)
  }, [userSubscriptions, filter])

  const getStatusIcon = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="text-green-500" size={24} />
      case 'cancelled':
        return <XCircle className="text-red-500" size={24} />
      case 'expired':
        return <AlertCircle className="text-yellow-500" size={24} />
      case 'paused':
        return <Clock className="text-gray-400" size={24} />
    }
  }

  const getStatusColor = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'expired':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'paused':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const stats = {
    active: userSubscriptions.filter(s => s.status === 'active').length,
    total: userSubscriptions.length,
    renewal: userSubscriptions.reduce((sum, s) => sum + (s.status === 'active' && s.autoRenew ? s.price : 0), 0),
  }

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
            <h1 className="text-4xl font-bold text-white mb-2">{t('subscriptions.title', language)}</h1>
            <p className="text-gray-400">Manage and view all your active subscriptions</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Active Subscriptions', value: stats.active, color: 'green' },
              { label: 'Total Subscriptions', value: stats.total, color: 'blue' },
              { label: 'Monthly Renewal', value: formatCurrency(stats.renewal), color: 'purple' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold ${
                  stat.color === 'green' && 'text-green-400' ||
                  stat.color === 'blue' && 'text-blue-400' ||
                  stat.color === 'purple' && 'text-purple-400'
                }`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {(['all', 'active', 'cancelled', 'expired'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                  filter === status
                    ? 'bg-netflix-red text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {status === 'all' && 'All'}
                {status === 'active' && t('subscriptions.active', language)}
                {status === 'cancelled' && t('subscriptions.cancelled', language)}
                {status === 'expired' && t('subscriptions.expired', language)}
              </button>
            ))}
          </div>

          {/* Subscriptions List */}
          {filteredSubs.length > 0 ? (
            <div className="space-y-4">
              {filteredSubs.map((subscription, index) => {
                const product = mockProducts.find(p => p.id === subscription.productId)
                if (!product) return null

                return (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-dark rounded-2xl p-6 border border-white/10 hover:border-netflix-red/50 transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                      {/* Product Image */}
                      <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-netflix-dark hidden md:block">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div>
                        <h3 className="text-white font-bold text-lg mb-1">{product.name}</h3>
                        <p className="text-gray-400 text-sm">{product.description}</p>
                      </div>

                      {/* Subscription Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-400 text-xs">Started</p>
                            <p className="text-white font-semibold text-sm">{formatDate(subscription.startDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RotateCcw size={16} className={subscription.autoRenew ? 'text-green-400' : 'text-gray-600'} />
                          <p className="text-gray-400 text-xs">
                            {subscription.autoRenew ? 'Auto-renews' : 'Manual renewal'}
                          </p>
                        </div>
                      </div>

                      {/* Price & Renewal */}
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Price</p>
                        <p className="text-white font-bold text-lg mb-3">{formatCurrency(subscription.price)}</p>
                        <p className="text-gray-400 text-xs">
                          {subscription.status === 'active' && `Renews ${formatDate(subscription.renewalDate)}`}
                          {subscription.status === 'expired' && `Expired ${formatDate(subscription.endDate)}`}
                          {subscription.status === 'cancelled' && 'Cancelled'}
                        </p>
                      </div>

                      {/* Status & Actions */}
                      <div className="space-y-3">
                        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 w-fit ${getStatusColor(subscription.status)}`}>
                          {getStatusIcon(subscription.status)}
                          <span className="font-semibold text-sm capitalize">{subscription.status}</span>
                        </div>

                        <div className="space-y-2">
                          {subscription.status === 'active' && (
                            <>
                              <button className="w-full bg-netflix-red/20 hover:bg-netflix-red/30 text-netflix-red text-sm font-semibold py-2 px-3 rounded transition-all">
                                Manage
                              </button>
                              <button className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold py-2 px-3 rounded transition-all">
                                Cancel
                              </button>
                            </>
                          )}
                          {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
                            <button className="w-full bg-netflix-red hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition-all">
                              Renew
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <h3 className="text-white text-xl font-semibold mb-2">No subscriptions found</h3>
              <p className="text-gray-400 mb-6">Start your journey with premium content</p>
              <Link
                href="/marketplace"
                className="inline-block bg-netflix-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Browse Plans
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </AppLayout>
  )
}
