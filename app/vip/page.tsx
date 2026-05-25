'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { motion } from 'framer-motion'
import { Star, Crown, Zap, Gift, BarChart3, Shield, Clock, CheckCircle } from 'lucide-react'

interface VIPTier {
  id: string
  name: string
  icon: React.ReactNode
  price: number
  description: string
  color: string
  benefits: string[]
  popular?: boolean
}

const VIP_TIERS: VIPTier[] = [
  {
    id: 'silver',
    name: 'Silver',
    icon: <Star size={32} />,
    price: 4.99,
    description: 'Essential benefits to get started',
    color: 'from-slate-400 to-gray-600',
    benefits: [
      '5% discount on all purchases',
      'Priority customer support',
      'Exclusive deals monthly',
      'Early access to new products',
      'Members-only events',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: <Crown size={32} />,
    price: 9.99,
    description: 'Premium features for power users',
    color: 'from-yellow-400 to-orange-500',
    benefits: [
      '15% discount on all purchases',
      '24/7 priority support',
      'Exclusive weekly deals',
      'Early access to launches',
      'Free shipping on orders',
      'Quarterly gifts & surprises',
      'VIP lounge access',
    ],
    popular: true,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: <Zap size={32} />,
    price: 19.99,
    description: 'Exclusive luxury membership',
    color: 'from-purple-400 to-pink-600',
    benefits: [
      '25% discount on all purchases',
      'Dedicated personal account manager',
      'Daily exclusive deals',
      'Instant early access',
      'Free shipping + returns',
      'Monthly luxury gifts',
      'Exclusive VIP events & meetups',
      'Birthday bonus rewards',
      'Concierge service',
    ],
  },
]

export default function VIPPage() {
  const { currentUser } = useApp()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-white mb-4">VIP Membership Tiers</h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Unlock exclusive benefits, premium support, and special rewards with our VIP membership tiers
            </p>
          </motion.div>

          {/* Current Tier Info */}
          {currentUser && currentUser.vipTier && currentUser.vipTier !== 'none' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-6 border border-netflix-red/50 bg-netflix-red/10 mb-12"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Your Current Tier</p>
                  <h2 className="text-3xl font-bold text-netflix-red capitalize">{currentUser.vipTier} VIP</h2>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1">Member Since</p>
                  <p className="text-white font-semibold">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIP Tiers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {VIP_TIERS.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                onHoverStart={() => setSelectedTier(tier.id)}
                onHoverEnd={() => setSelectedTier(null)}
                className={`relative group rounded-2xl p-8 border transition-all duration-300 ${
                  tier.popular
                    ? 'md:scale-105 glass-dark border-netflix-red/50 shadow-2xl shadow-netflix-red/20'
                    : 'glass-dark border-white/10 hover:border-white/20'
                } ${selectedTier === tier.id ? 'scale-105' : ''}`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-netflix-red text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Icon & Title */}
                <div className={`mb-4 p-4 rounded-full w-fit bg-gradient-to-br ${tier.color} text-white`}>
                  {tier.icon}
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">{tier.name}</h2>
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="text-4xl font-bold text-white mb-2">
                    ${tier.price.toFixed(2)}
                    <span className="text-xl text-gray-400 font-normal">/month</span>
                  </div>
                  <p className="text-gray-400 text-sm">Billed monthly, cancel anytime</p>
                </div>

                {/* Benefits */}
                <div className="mb-8 space-y-3">
                  {tier.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle size={20} className={`text-${tier.id === 'silver' ? 'gray' : tier.id === 'gold' ? 'yellow' : 'purple'}-400 flex-shrink-0 mt-0.5`} />
                      <span className="text-gray-300 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
                  tier.popular
                    ? 'bg-netflix-red hover:bg-red-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                } ${selectedTier === tier.id ? 'shadow-lg shadow-netflix-red/50' : ''}`}>
                  {currentUser?.vipTier === tier.id ? 'Current Tier' : `Upgrade to ${tier.name}`}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-dark rounded-2xl p-8 border border-white/10 mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-8">Detailed Comparison</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Standard</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Silver</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Gold</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Platinum</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Discount', standard: '—', silver: '5%', gold: '15%', platinum: '25%' },
                    { feature: 'Support Priority', standard: 'Standard', silver: 'High', gold: 'Very High', platinum: 'Dedicated' },
                    { feature: 'Monthly Deals', standard: '—', silver: 'Monthly', gold: 'Weekly', platinum: 'Daily' },
                    { feature: 'Early Access', standard: '—', silver: 'Yes', gold: 'Yes', platinum: 'Instant' },
                    { feature: 'Free Shipping', standard: '—', silver: '—', gold: 'Yes', platinum: 'Yes' },
                    { feature: 'Exclusive Events', standard: '—', silver: '—', gold: 'Yes', platinum: 'Yes' },
                    { feature: 'Personal Manager', standard: '—', silver: '—', gold: '—', platinum: 'Yes' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                      <td className="py-4 px-4 text-white font-semibold">{row.feature}</td>
                      <td className="py-4 px-4 text-center text-gray-400">{row.standard}</td>
                      <td className="py-4 px-4 text-center text-gray-300">{row.silver}</td>
                      <td className="py-4 px-4 text-center text-gray-300">{row.gold}</td>
                      <td className="py-4 px-4 text-center text-white font-semibold">{row.platinum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {[
                {
                  q: 'Can I upgrade or downgrade my tier at any time?',
                  a: 'Yes! You can change your tier whenever you want. Changes take effect on your next billing cycle.',
                },
                {
                  q: 'Do you offer a free trial?',
                  a: 'We offer a 7-day free trial for new members. Upgrade to any tier and experience the benefits risk-free.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayOS, digital wallets, and bank transfers for your convenience.',
                },
                {
                  q: 'Is there a long-term commitment?',
                  a: 'No! Our memberships are month-to-month. You can cancel anytime without penalties or hidden fees.',
                },
              ].map((faq, i) => (
                <div key={i} className="glass-dark rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-bold mb-2">{faq.q}</h3>
                  <p className="text-gray-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          {!currentUser?.vipTier || currentUser.vipTier === 'none' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-16 text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Join?</h2>
              <p className="text-gray-400 mb-8">Start your VIP membership journey today and unlock exclusive benefits</p>
              <button className="bg-netflix-red hover:bg-red-700 text-white font-bold py-4 px-10 rounded-lg transition-all text-lg">
                Upgrade to VIP
              </button>
            </motion.div>
          ) : null}
        </div>
      </section>
    </AppLayout>
  )
}
