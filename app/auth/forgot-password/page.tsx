'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { validateClient } from '@/lib/validation/client'
import { forgotPasswordBodySchema } from '@/lib/validation/auth'

export default function ForgotPasswordPage() {
  const { language } = useApp()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const valid = validateClient(forgotPasswordBodySchema, { email, language }, language)
    if (!valid.success) {
      setError(valid.error)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valid.data),
      })
      if (!res.ok) throw new Error('Failed')
      setSent(true)
    } catch {
      setError(language === 'vi' ? 'Không gửi được email' : 'Could not send email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image src="/images/login-bg.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-white/15 bg-black/50 backdrop-blur-xl p-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">{t('auth.forgotTitle', language)}</h1>
          <p className="text-gray-400 text-sm mb-6">{t('auth.forgotDesc', language)}</p>

          {sent ? (
            <p className="text-green-400 text-sm mb-6">{t('auth.resetSent', language)}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email', language)}
                  className="w-full bg-white/5 border border-white/10 text-white pl-10 py-3 rounded-xl"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-netflix-red hover:bg-red-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
              >
                {loading ? t('common.loading', language) : t('auth.sendReset', language)}
              </button>
            </form>
          )}

          <Link href="/auth/login" className="block text-center text-netflix-red text-sm mt-6 font-semibold">
            {t('auth.backLogin', language)}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
