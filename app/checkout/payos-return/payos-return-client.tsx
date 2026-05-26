'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { clearPayosPendingCheckout, loadPayosPendingCheckout } from '@/lib/payos/pending-checkout'
import { isPayosReturnCancelled } from '@/lib/payos/client'
import type { Invoice, PurchasedAccount } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { PaymentSuccessView } from '@/components/checkout/payment-success-view'

function normalizeInvoice(inv: Invoice | null | undefined): Invoice | null {
  if (!inv) return null
  return {
    ...inv,
    invoiceDate: new Date(inv.invoiceDate),
    dueDate: new Date(inv.dueDate),
    paidDate: inv.paidDate ? new Date(inv.paidDate) : undefined,
    createdAt: new Date(inv.createdAt),
    updatedAt: new Date(inv.updatedAt),
  }
}

function normalizeAccount(a: PurchasedAccount): PurchasedAccount {
  return {
    ...a,
    expiresAt: new Date(a.expiresAt),
    createdAt: new Date(a.createdAt),
  }
}

export function PayosReturnClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    currentUser,
    authReady,
    language,
    setCart,
    setUserInvoices,
    setPurchasedAccounts,
    userInvoices,
    purchasedAccounts,
    refreshUserData,
  } = useApp()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [payosDetail, setPayosDetail] = useState<{
    status?: string
    amountRemaining?: number
    transferMemo?: string
    orderCode?: number
  } | null>(null)
  const started = useRef(false)

  const runFinish = async () => {
    const payosCode = searchParams.get('code')
    const payosStatus = searchParams.get('status')
    const payosCancel = searchParams.get('cancel')
    const orderCodeParam = searchParams.get('orderCode')

    const stored = loadPayosPendingCheckout()
    let orderCode = Number(orderCodeParam || stored?.orderCode)

    if (!orderCode) {
      setError(t('checkout.payosSessionLost', language))
      return
    }

    setRetrying(true)
    setError('')

    try {
      const res = await fetch('/api/payments/payos/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          orderCode,
          code: payosCode,
          status: payosStatus,
          cancel: payosCancel,
          language,
          cart: stored?.cart,
          productNames: stored?.productNames,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('checkout.payosNotPaid', language))
        if (data.orderCode || data.payosStatus || data.amountRemaining != null) {
          setPayosDetail({
            orderCode: data.orderCode ?? orderCode,
            status: data.payosStatus,
            amountRemaining: data.amountRemaining,
            transferMemo: data.transferMemo,
          })
        } else {
          try {
            const v = await fetch(
              `/api/payments/payos/verify?orderCode=${orderCode}`,
              { credentials: 'same-origin' },
            )
            const vd = await v.json()
            if (!vd.paid) {
              setPayosDetail({
                orderCode,
                status: vd.status,
                amountRemaining: vd.amountRemaining,
                transferMemo: vd.transferMemo,
              })
            }
          } catch {
            /* ignore */
          }
        }
        return
      }

      clearPayosPendingCheckout()
      setCart(null)

      if (data.alreadyCompleted) {
        await refreshUserData()
        setMessage(t('checkout.confirmed', language))
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        return
      }

      const invoice = normalizeInvoice(data.invoice as Invoice)
      const accounts = ((data.accounts as PurchasedAccount[]) || []).map(normalizeAccount)

      if (!invoice) {
        await refreshUserData()
        setMessage(t('checkout.confirmed', language))
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        return
      }

      setUserInvoices([invoice, ...userInvoices])
      if (accounts.length > 0) {
        setPurchasedAccounts([...accounts, ...purchasedAccounts])
      } else {
        await refreshUserData()
      }
      setMessage(t('checkout.confirmed', language))
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
    } catch (e) {
      setError(e instanceof Error ? e.message : t('checkout.orderFailed', language))
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    if (!authReady || started.current) return

    const payosStatus = searchParams.get('status')
    const payosCancel = searchParams.get('cancel')

    if (isPayosReturnCancelled({ status: payosStatus, cancel: payosCancel })) {
      setError(t('checkout.payosCancelled', language))
      return
    }

    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    started.current = true
    runFinish()
  }, [authReady, currentUser, searchParams, language, router])

  return (
    <AppLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        {error ? (
          <div className="text-center max-w-md space-y-4">
            <p className="text-red-400">{error}</p>
            <p className="text-gray-600 text-xs font-mono break-all">
              URL: code={searchParams.get('code') ?? '—'} status={searchParams.get('status') ?? '—'}{' '}
              orderCode={searchParams.get('orderCode') ?? payosDetail?.orderCode ?? '—'}
            </p>
            {payosDetail && (
              <div className="text-left text-sm text-gray-400 bg-white/5 rounded-lg p-4 space-y-2">
                <p>
                  PayOS: <span className="text-amber-400">{payosDetail.status || 'PENDING'}</span>
                  {payosDetail.amountRemaining != null && (
                    <>
                      {' '}
                      — còn{' '}
                      <span className="text-white">
                        {payosDetail.amountRemaining.toLocaleString('vi-VN')}đ
                      </span>
                    </>
                  )}
                </p>
                {payosDetail.transferMemo && (
                  <p>
                    {language === 'vi' ? 'Nội dung CK (bắt buộc):' : 'Transfer memo:'}{' '}
                    <span className="font-mono text-netflix-red">{payosDetail.transferMemo}</span>
                  </p>
                )}
                <p className="text-xs">
                  {language === 'vi'
                    ? 'QR PayOS có thể chuyển thẳng vào TK ngân hàng (PayOS không đối soát). Nếu đã CK: ghi đúng nội dung bên trên — app dùng SePay để xác nhận đơn, đợi 1–5 phút rồi Thử lại.'
                    : 'PayOS QR may pay your bank directly. If transferred, use the memo above — SePay confirms the order; retry in 1–5 minutes.'}
                </p>
              </div>
            )}
            <p className="text-gray-500 text-sm">
              {language === 'vi'
                ? 'Nếu PayOS đã ghi nhận giao dịch, bấm thử lại.'
                : 'If PayOS shows payment received, try again.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  started.current = false
                  runFinish()
                }}
                disabled={retrying}
                className="btn-primary-red px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {retrying ? t('checkout.payosVerifying', language) : t('common.retry', language)}
              </button>
              <Link href="/checkout" className="text-gray-400 hover:text-white py-2">
                {t('checkout.backCart', language)}
              </Link>
            </div>
          </div>
        ) : message ? (
          <PaymentSuccessView language={language} active />
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-300">
            <Loader2 className="animate-spin text-netflix-red" size={40} />
            <p>{t('checkout.payosVerifying', language)}</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
