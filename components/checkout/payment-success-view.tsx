'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { t, type Lang } from '@/lib/translations'
import { usePaymentSuccessRedirect } from '@/lib/hooks/use-payment-success-redirect'

type Props = {
  language: Lang
  active: boolean
  children?: React.ReactNode
}

export function PaymentSuccessView({ language, active, children }: Props) {
  const { remaining } = usePaymentSuccessRedirect(active)

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <CheckCircle2 size={72} className="text-green-500 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">{t('checkout.confirmed', language)}</h1>
      <p className="text-gray-400 mb-2">{t('checkout.confirmedDesc', language)}</p>
      <p className="text-gray-500 text-sm mb-6">
        {t('checkout.redirectCountdown', language).replace('{s}', String(remaining))}
      </p>
      {children}
      <Link href="/my-accounts" className="btn-primary-red px-8 py-3 rounded-lg mt-4">
        {t('checkout.viewAccounts', language)}
      </Link>
    </div>
  )
}
