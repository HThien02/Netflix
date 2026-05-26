'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  saveSepayPaymentDetails,
} from '@/lib/sepay/pending-checkout'
import { Copy, Loader2, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'

type SepayDisplay = {
  paymentCode: string
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
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initStarted = useRef(false)

  const applyDisplay = useCallback((data: SepayDisplay) => {
    setDisplay(data)
    const stored = loadSepayPendingCheckout()
    if (stored?.cart) {
      saveSepayPaymentDetails(data.paymentCode, data.amountVnd, {
        qrImageUrl: data.qrImageUrl,
        bank: data.bank,
      })
    }
  }, [])

  const checkPaid = useCallback(async (code: string) => {
    try {
      const res = await fetch(
        `/api/payments/sepay/verify?code=${encodeURIComponent(code)}`,
        { credentials: 'same-origin' },
      )
      if (res.ok) {
        setPaid(true)
        clearSepayPendingCheckout()
        setCart(null)
        await refreshUserData()
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch {
      /* ignore */
    }
  }, [refreshUserData, setCart])

  useEffect(() => {
    if (!authReady || initStarted.current) return
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    initStarted.current = true

    const init = async () => {
      try {
        if (codeParam) {
          const orderRes = await fetch(
            `/api/payments/sepay/order?code=${encodeURIComponent(codeParam)}`,
            { credentials: 'same-origin' },
          )
          const orderData = await orderRes.json()
          if (orderRes.ok && orderData.paid) {
            setPaid(true)
            return
          }
          if (orderRes.ok && orderData.paymentCode) {
            applyDisplay(orderData as SepayDisplay)
            return
          }
          throw new Error(orderData.error || t('checkout.sepaySessionLost', language))
        }

        const stored = loadSepayPendingCheckout()
        if (!stored?.cart?.items?.length) {
          setError(t('checkout.sepaySessionLost', language))
          return
        }

        const createRes = await fetch('/api/payments/sepay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            cart: stored.cart,
            userId: currentUser.id,
            language,
            productNames: stored.productNames,
          }),
        })
        const createData = await createRes.json()
        if (!createRes.ok) {
          throw new Error(createData.error || 'SePay error')
        }

        applyDisplay(createData as SepayDisplay)
        router.replace(`/checkout/sepay?code=${encodeURIComponent(createData.paymentCode)}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('checkout.orderFailed', language))
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [authReady, currentUser, codeParam, language, router, applyDisplay])

  useEffect(() => {
    if (!display?.paymentCode || paid || loading) return
    void checkPaid(display.paymentCode)
    pollRef.current = setInterval(() => void checkPaid(display.paymentCode), 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [display?.paymentCode, paid, loading, checkPaid])

  const copyCode = async () => {
    if (!display?.paymentCode) return
    await navigator.clipboard.writeText(display.paymentCode)
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

  if (paid) {
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
          <h1 className="text-2xl font-bold text-white mb-2">{t('checkout.sepayTitle', language)}</h1>
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
                  alt="VietQR"
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
              <p className="text-gray-400 text-xs mb-1">{t('checkout.sepayTransferMemo', language)}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-mono font-bold text-netflix-red">{display.paymentCode}</span>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
                >
                  <Copy size={16} />
                  {copied ? t('checkout.sepayCopied', language) : t('checkout.sepayCopy', language)}
                </button>
              </div>
            </div>

            <p className="text-gray-500 text-xs">{t('checkout.sepayWaiting', language)}</p>
            <button
              type="button"
              onClick={() => void checkPaid(display.paymentCode)}
              className="w-full btn-primary-red py-3 rounded-lg"
            >
              {t('checkout.sepayCheckPaid', language)}
            </button>
          </div>

          <Link href="/checkout" className="block text-center text-gray-500 text-sm mt-6 hover:text-white">
            {t('checkout.backCart', language)}
          </Link>
        </div>
      </section>
    </AppLayout>
  )
}
