'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatCurrency } from '@/lib/utils/format'
import {
  clearSepayPendingCheckout,
  loadSepayPendingCheckout,
} from '@/lib/sepay/pending-checkout'
import { Copy, Loader2, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'

type SepayDisplay = {
  paymentCode: string
  transferDescription: string
  amountVnd: number
  qrImageUrl: string
  bank: {
    bankBin: string
    bankName: string
    accountNumber: string
    accountName: string
  }
}

export function SepayCheckoutClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentUser, authReady, language, refreshUserData, setCart } = useApp()

  const codeParam = searchParams.get('code')?.trim().toUpperCase() || ''

  const [display, setDisplay] = useState<SepayDisplay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkPaid = useCallback(async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/payments/sepay/verify?code=${encodeURIComponent(code)}`, {
        credentials: 'same-origin',
      })
      const data = (await res.json()) as { paid?: boolean; sepayTransactionId?: number }
      return data.paid === true && data.sepayTransactionId != null
    } catch {
      return false
    }
  }, [])

  const handlePaid = useCallback(async () => {
    setPaid(true)
    clearSepayPendingCheckout()
    setCart(null)
    await refreshUserData()
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  }, [refreshUserData, setCart])

  useEffect(() => {
    if (!authReady) return
    if (!currentUser) {
      router.push('/auth/login')
      return
    }
    if (!codeParam) {
      setError(t('checkout.sepaySessionLost', language))
      setLoading(false)
      return
    }

    const init = async () => {
      try {
        const stored = loadSepayPendingCheckout()
        if (
          stored?.paymentCode?.toUpperCase() === codeParam &&
          stored.amountVnd &&
          stored.qrImageUrl &&
          stored.bank
        ) {
          setDisplay({
            paymentCode: codeParam,
            transferDescription:
              stored.transferDescription || `Thanh toan don hang ${codeParam}`,
            amountVnd: stored.amountVnd,
            qrImageUrl: stored.qrImageUrl,
            bank: stored.bank,
          })
          setLoading(false)
          return
        }

        const orderRes = await fetch(
          `/api/payments/sepay/order?code=${encodeURIComponent(codeParam)}`,
          { credentials: 'same-origin' },
        )
        const orderData = await orderRes.json()

        if (orderRes.ok && orderData.paid === true && orderData.sepayTransactionId) {
          clearSepayPendingCheckout()
          setCart(null)
          setAlreadyPaid(true)
          return
        }

        if (orderRes.ok && orderData.paymentCode) {
          setDisplay(orderData as SepayDisplay)
          return
        }

        throw new Error(orderData.error || t('checkout.sepaySessionLost', language))
      } catch (e) {
        setError(e instanceof Error ? e.message : t('checkout.orderFailed', language))
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [authReady, currentUser, codeParam, language, router, setCart])

  useEffect(() => {
    if (!display?.paymentCode || paid || alreadyPaid || loading) return

    let cancelled = false

    const poll = async () => {
      const ok = await checkPaid(display.paymentCode)
      if (!cancelled && ok) await handlePaid()
    }

    void poll()
    const id = window.setInterval(() => void poll(), 4000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [display?.paymentCode, paid, alreadyPaid, loading, checkPaid, handlePaid])

  const copyCode = async () => {
    if (!display?.transferDescription) return
    await navigator.clipboard.writeText(display.transferDescription)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-300">
          <Loader2 className="animate-spin text-netflix-red" size={40} />
          <p>{t('checkout.sepayLoading', language)}</p>
        </div>
      </AppLayout>
    )
  }

  if (alreadyPaid || paid) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <CheckCircle2 size={72} className="text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('checkout.confirmed', language)}</h1>
          <p className="text-gray-400 mb-6">{t('checkout.confirmedDesc', language)}</p>
          <Link href="/my-accounts" className="btn-primary-red px-8 py-3 rounded-lg">
            {t('checkout.viewAccounts', language)}
          </Link>
        </div>
      </AppLayout>
    )
  }

  if (error || !display) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <p className="text-red-400 mb-4">{error || t('checkout.orderFailed', language)}</p>
          <Link href="/checkout" className="text-gray-400 hover:text-white">
            {t('checkout.backCart', language)}
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-lg">
          <h1 className="text-2xl font-bold text-white mb-1">{t('checkout.sepayTitle', language)}</h1>
          <p className="text-gray-400 text-sm mb-6">{t('checkout.sepayDesc', language)}</p>

          <div className="glass-dark rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">{t('checkout.amount', language)}</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(display.amountVnd)}</p>
            </div>

            {display.qrImageUrl && (
              <div className="flex justify-center">
                <Image
                  src={display.qrImageUrl}
                  alt="QR"
                  width={240}
                  height={240}
                  className="rounded-lg bg-white p-2"
                  unoptimized
                />
              </div>
            )}

            <div className="text-sm space-y-2 border-t border-white/10 pt-4">
              <div className="flex justify-between gap-2">
                <span className="text-gray-400">{t('checkout.sepayBank', language)}</span>
                <span className="text-white text-right">{display.bank.bankName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400">{t('checkout.sepayAccount', language)}</span>
                <span className="text-white font-mono">{display.bank.accountNumber}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400">{t('checkout.sepayAccountName', language)}</span>
                <span className="text-white text-right">{display.bank.accountName}</span>
              </div>
            </div>

            <div className="bg-netflix-red/10 border border-netflix-red/40 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-2">{t('checkout.sepayTransferMemo', language)}</p>
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-mono font-bold text-netflix-red break-all leading-snug">
                  {display.transferDescription}
                </p>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="flex shrink-0 items-center gap-1 text-sm text-gray-300 hover:text-white"
                >
                  <Copy size={16} />
                  {copied ? t('checkout.sepayCopied', language) : t('checkout.sepayCopy', language)}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
              <Loader2 size={16} className="animate-spin text-netflix-red shrink-0" />
              <p className="text-center">{t('checkout.sepayWaiting', language)}</p>
            </div>
          </div>

          <Link href="/checkout" className="block text-center text-gray-500 text-sm mt-6 hover:text-white">
            {t('checkout.backCart', language)}
          </Link>
        </div>
      </section>
    </AppLayout>
  )
}
