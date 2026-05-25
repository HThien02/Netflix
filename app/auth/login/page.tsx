'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRedirectIfAuthenticated } from '@/lib/hooks/use-redirect-if-authenticated'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'
import { loadUserData } from '@/lib/user-data'
import type { User } from '@/lib/types'
import { BrandLogo } from '@/components/brand-logo'

export default function LoginPage() {
  const router = useRouter()
  const { shouldShowAuthForm } = useRedirectIfAuthenticated()
  const {
    setCurrentUser,
    setIsAuthenticated,
    setUserSubscriptions,
    setUserInvoices,
    setPurchasedAccounts,
    language,
  } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!shouldShowAuthForm) {
    return null
  }

  const completeLogin = async (user: User) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    sessionStorage.setItem('netflix-intro-sound-unlocked', '1')

    const data = await loadUserData(user.id)
    setUserSubscriptions(data.subscriptions)
    setUserInvoices(data.invoices)
    setPurchasedAccounts(data.purchasedAccounts)

    router.push('/')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.user) {
        await completeLogin({
          id: data.user.id,
          email: data.user.email,
          password: '',
          fullName: data.user.fullName,
          role: data.user.role,
          language: data.user.language ?? 'vi',
          avatar: data.user.avatar,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        setError(data.error || t('auth.invalidLogin', language))
      }
    } catch {
      setError(t('auth.loginError', language))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image src="/images/login-bg.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-netflix-black/90 to-red-950/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(229,9,20,0.25),transparent_55%)]" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col justify-center px-12 xl:px-20 py-16"
        >
          <div className="mb-8">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
            <span className="text-gradient">{t('auth.loginBrand', language)}</span>{' '}
            {t('auth.loginBrand2', language)}
          </h1>
          <p className="text-gray-300 text-lg max-w-md">{t('auth.loginDesc', language)}</p>
          <div className="flex items-center gap-2 mt-10 text-gray-400 text-sm">
            <Sparkles size={16} className="text-netflix-red" />
            <span>{t('auth.loginTagline', language)}</span>
          </div>
        </motion.div>

        <div className="flex items-center justify-center px-4 py-12 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden flex justify-center mb-8">
              <BrandLogo size="lg" />
            </div>

            <div className="rounded-2xl p-8 border border-white/15 bg-black/50 backdrop-blur-xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">{t('nav.signIn', language)}</h2>
                <p className="text-gray-400 text-sm mt-1">{t('auth.welcomeBack', language)}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('auth.email', language)}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white pl-10 py-3 rounded-xl focus:border-netflix-red focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white text-sm font-medium">{t('auth.password', language)}</label>
                    <Link href="/auth/forgot-password" className="text-netflix-red text-xs hover:underline">
                      {t('auth.forgotPassword', language)}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-10 py-3 rounded-xl focus:border-netflix-red focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-netflix-red hover:bg-red-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  {loading ? t('auth.signingIn', language) : t('nav.signIn', language)}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm mt-8">
                {t('auth.noAccount', language)}{' '}
                <Link href="/auth/signup" className="text-netflix-red font-semibold">
                  {t('nav.signUp', language)}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
