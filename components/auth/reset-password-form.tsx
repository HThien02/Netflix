'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { Lock } from 'lucide-react'
import { validateClient } from '@/lib/validation/client'
import { resetPasswordFormSchema } from '@/lib/validation/auth'
import { normalizeResetToken } from '@/lib/auth/password-reset'

export function ResetPasswordForm({ token: rawToken }: { token: string }) {
  const { language } = useApp()
  const router = useRouter()
  const token = normalizeResetToken(rawToken)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const invalidLink =
    !token || token.length < 32
      ? language === 'vi'
        ? 'Link không hợp lệ hoặc đã hết hạn'
        : 'Invalid or expired link'
      : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const valid = validateClient(
      resetPasswordFormSchema,
      { token, password, confirmPassword: confirm, language },
      language,
    )
    if (!valid.success) {
      setError(valid.error)
      return
    }

    setLoading(true)
    try {
      const { confirmPassword: _, ...payload } = valid.data
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error', language))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/50 backdrop-blur-xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">{t('auth.resetTitle', language)}</h1>
      <p className="text-gray-400 text-sm mb-6">{t('auth.resetDesc', language)}</p>

      {done ? (
        <p className="text-green-400">{t('auth.resetSuccess', language)}</p>
      ) : invalidLink ? (
        <p className="text-red-400 text-sm">{invalidLink}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password', language)}
              className="w-full bg-white/5 border border-white/10 text-white pl-10 py-3 rounded-xl"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('auth.confirmPassword', language)}
              className="w-full bg-white/5 border border-white/10 text-white pl-10 py-3 rounded-xl"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-netflix-red text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? t('common.loading', language) : t('auth.resetSubmit', language)}
          </button>
        </form>
      )}
      <Link href="/auth/login" className="block text-center text-netflix-red text-sm mt-6 font-semibold">
        {t('auth.backLogin', language)}
      </Link>
    </div>
  )
}
