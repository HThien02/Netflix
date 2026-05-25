'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRedirectIfAuthenticated } from '@/lib/hooks/use-redirect-if-authenticated'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { User } from '@/lib/types'
import { t } from '@/lib/translations'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User as UserIcon, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { shouldShowAuthForm } = useRedirectIfAuthenticated()
  const { setCurrentUser, setIsAuthenticated, language } = useApp()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!shouldShowAuthForm) {
    return null
  }

  const validateForm = () => {
    if (!fullName.trim()) {
      setError(t('auth.nameRequired', language))
      return false
    }
    if (!email.includes('@')) {
      setError(t('auth.emailRequired', language))
      return false
    }
    if (password.length < 6) {
      setError(t('auth.passwordMin', language))
      return false
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch', language))
      return false
    }
    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, fullName, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('common.error', language))

      const newUser: User = {
        id: data.user.id,
        email: data.user.email,
        password: '',
        fullName: data.user.fullName,
        role: 'customer',
        language,
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
      }

      setCurrentUser(newUser)
      setIsAuthenticated(true)
      sessionStorage.setItem('netflix-intro-sound-unlocked', '1')
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error', language))
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = React.useMemo(() => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 6) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    return strength
  }, [password])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-netflix-black via-netflix-dark to-netflix-black px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-netflix-red/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
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
            <p className="text-gray-400 text-sm mt-2">{t('nav.signUp', language)}</p>
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

          <form onSubmit={handleSignup} className="space-y-4 mb-6">
            {/* Full Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/30 border border-white/10 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                  required
                />
              </div>
            </div>

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
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passwordStrength ? 'bg-netflix-red' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {passwordStrength === 0 && t('auth.passwordWeak', language)}
                    {passwordStrength === 1 && t('auth.passwordFair', language)}
                    {passwordStrength === 2 && t('auth.passwordGood', language)}
                    {passwordStrength === 3 && t('auth.passwordStrong', language)}
                    {passwordStrength === 4 && t('auth.passwordVeryStrong', language)}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-white/10 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <div className="mt-2 flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle size={14} />
                  Passwords match
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 bg-black/30 border border-white/10 rounded cursor-pointer mt-1"
                required
              />
              <label htmlFor="terms" className="ml-2 text-gray-400 text-xs cursor-pointer">
                I agree to the <Link href="#" className="text-netflix-red hover:underline">Terms of Service</Link> and <Link href="#" className="text-netflix-red hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-netflix bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? t('auth.creating', language) : t('auth.createAccount', language)}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-netflix-red hover:text-red-500 transition-colors font-semibold">
              {t('nav.signIn', language)}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
