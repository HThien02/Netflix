'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { t } from '@/lib/translations'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { normalizeResetToken } from '@/lib/auth/password-reset'

function LegacyQueryRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) return
    const normalized = normalizeResetToken(token)
    router.replace(`/auth/reset-password/${encodeURIComponent(normalized)}`)
  }, [token, router])

  if (token) {
    return <div className="text-white text-sm">{t('common.loading', 'vi')}</div>
  }

  return <ResetPasswordForm token="" />
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image src="/images/login-bg.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Suspense fallback={<div className="text-white">{t('common.loading', 'vi')}</div>}>
          <LegacyQueryRedirect />
        </Suspense>
      </div>
    </div>
  )
}
