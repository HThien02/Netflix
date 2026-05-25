'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { authenticateUser } from '@/lib/auth/session'
import { getUserSubscriptions, getUserInvoices } from '@/lib/supabase/queries'
import type { User } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const {
    setCurrentUser,
    setIsAuthenticated,
    setUserSubscriptions,
    setUserInvoices,
    language,
  } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const completeLogin = async (user: User, source: string) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('isAuthenticated', 'true')

    if (source === 'supabase') {
      const [subs, invoices] = await Promise.all([
        getUserSubscriptions(user.id),
        getUserInvoices(user.id),
      ])
      setUserSubscriptions(
        (subs || []).map((s: Record<string, unknown>) => ({
          id: String(s.id),
          userId: String(s.user_id),
          productId: String(s.product_id),
          planType: (s.plan_type as 'monthly' | 'quarterly' | 'annual') || 'monthly',
          status: (s.status as 'active' | 'cancelled' | 'expired' | 'paused') || 'active',
          startDate: new Date(String(s.start_date)),
          renewalDate: new Date(String(s.end_date || s.start_date)),
          autoRenew: Boolean(s.auto_renew),
          price: Number(s.price) || 0,
          nextBillingDate: new Date(String(s.end_date || s.start_date)),
          createdAt: new Date(String(s.created_at)),
          updatedAt: new Date(String(s.updated_at)),
        })),
      )
      setUserInvoices(
        (invoices || []).map((inv: Record<string, unknown>) => ({
          id: String(inv.id),
          userId: String(inv.user_id),
          subscriptionId: String(inv.subscription_id || ''),
          amount: Number(inv.total_amount) || 0,
          taxAmount: Number(inv.tax_amount) || 0,
          totalAmount: Number(inv.final_amount) || 0,
          status:
            inv.status === 'completed'
              ? 'paid'
              : (inv.status as 'pending' | 'paid' | 'failed' | 'refunded') || 'pending',
          paymentMethod: (inv.payment_method as 'payos' | 'credit_card' | 'wallet') || 'payos',
          invoiceDate: new Date(String(inv.created_at)),
          dueDate: new Date(String(inv.created_at)),
          createdAt: new Date(String(inv.created_at)),
          updatedAt: new Date(String(inv.updated_at)),
        })),
      )
    }

    router.push('/')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user, source } = await authenticateUser(email, password)
      if (user && source) {
        await completeLogin(user, source)
      } else {
        setError(language === 'vi' ? 'Email hoặc mật khẩu không hợp lệ' : 'Invalid email or password')
      }
    } catch (err) {
      setError(language === 'vi' ? 'Lỗi đăng nhập' : 'Login error')
      console.error('[auth] Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async (demoEmail: string) => {
    setLoading(true)
    try {
      const { user, source } = await authenticateUser(demoEmail, 'demo123')
      if (user && source) await completeLogin(user, source)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-netflix-black via-netflix-dark to-netflix-black px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-netflix-red/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-dark rounded-2xl p-8 border border-white/10">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-netflix-red mb-2">N</h1>
            <h2 className="text-2xl font-bold text-white">NetflixHub</h2>
            <p className="text-gray-400 text-sm mt-2">{t('nav.signIn', language)}</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            {/* Email */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-black/30 border border-white/10 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-white/10 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 bg-black/30 border border-white/10 rounded cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-gray-400 text-sm cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-netflix bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : t('nav.signIn', language)}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mb-6">
            <p className="text-center text-gray-400 text-sm mb-3">{language === 'vi' ? 'Tài khoản Demo' : 'Demo Accounts'}</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickDemo('customer1@example.com')}
                className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 px-2 rounded border border-blue-500/30 transition-all"
              >
                {language === 'vi' ? 'Khách hàng' : 'Customer'}
              </button>
              <button
                onClick={() => handleQuickDemo('merchant1@example.com')}
                className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 px-2 rounded border border-green-500/30 transition-all"
              >
                {language === 'vi' ? 'Nhà bán' : 'Merchant'}
              </button>
              <button
                onClick={() => handleQuickDemo('admin@example.com')}
                className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2 px-2 rounded border border-purple-500/30 transition-all"
              >
                {language === 'vi' ? 'Quản trị' : 'Admin'}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400 text-sm">
            {t('common.noResults', language) === 'common.noResults' ? "Don't have an account? " : 'Don\'t have an account? '}
            <Link href="/auth/signup" className="text-netflix-red hover:text-red-500 transition-colors font-semibold">
              {t('nav.signUp', language)}
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          {language === 'vi' ? 'Mật khẩu demo: ' : 'Demo password: '}<span className="text-gray-400 font-mono">demo123</span>
        </p>
      </motion.div>
    </div>
  )
}
