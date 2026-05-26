'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatCurrency } from '@/lib/utils/format'
import { useProducts } from '@/lib/hooks/use-products'
import { getLocalizedProductName } from '@/lib/products-i18n'
import { planLabel } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'
import { savePayosPendingCheckout } from '@/lib/payos/pending-checkout'
import { saveSepayPendingCheckout, saveSepayPaymentDetails } from '@/lib/sepay/pending-checkout'
import { completePurchase } from '@/lib/orders/complete-purchase'
import { Invoice } from '@/lib/types'
import { motion } from 'framer-motion'
import { ArrowLeft, Smartphone, Building2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { PaymentSuccessView } from '@/components/checkout/payment-success-view'
import { useClientRateLimit } from '@/lib/hooks/use-client-rate-limit'
import { validateClient } from '@/lib/validation/client'
import { checkoutBillingSchema, cartSchema } from '@/lib/validation'

export default function CheckoutPage() {
  const router = useRouter()
  const {
    cart,
    currentUser,
    language,
    setCart,
    setUserInvoices,
    setPurchasedAccounts,
    userInvoices,
    purchasedAccounts,
  } = useApp()
  const { getById } = useProducts()
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [newInvoice, setNewInvoice] = useState<Invoice | null>(null)
  const [orderError, setOrderError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'payos' | 'sepay'>('sepay')
  const { canRun } = useClientRateLimit(2500)

  const [email, setEmail] = useState(currentUser?.email || '')
  const [fullName, setFullName] = useState(currentUser?.fullName || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

  if (!cart || !currentUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">{t('checkout.invalidSession', language)}</p>
          <Link href="/marketplace" className="btn-primary-red px-6 py-2 inline-block">
            {t('checkout.backMarket', language)}
          </Link>
        </div>
      </AppLayout>
    )
  }

  const buildProductNames = () => {
    const productNames: Record<string, string> = {}
    for (const item of cart.items) {
      const product = getById(item.productId)
      productNames[item.productId] = product
        ? getLocalizedProductName(product.id, product.name, language)
        : item.productName || 'Streaming'
    }
    return productNames
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canRun()) return
    setOrderError('')

    const billingCheck = validateClient(
      checkoutBillingSchema,
      { fullName, email, phone, address, city },
      language,
    )
    if (!billingCheck.success) {
      setOrderError(billingCheck.error)
      return
    }

    const cartCheck = validateClient(cartSchema, cart, language)
    if (!cartCheck.success) {
      setOrderError(cartCheck.error)
      return
    }

    setLoading(true)
    const productNames = buildProductNames()

    try {
      if (paymentMethod === 'sepay') {
        const sepayRes = await fetch('/api/payments/sepay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            cart: cartCheck.data,
            language,
            productNames,
          }),
        })
        const sepayData = await sepayRes.json()
        if (!sepayRes.ok || !sepayData.paymentCode) {
          throw new Error(sepayData.error || t('checkout.orderFailed', language))
        }
        saveSepayPendingCheckout(cart, productNames)
        saveSepayPaymentDetails(sepayData.paymentCode, sepayData.amountVnd, {
          qrImageUrl: sepayData.qrImageUrl,
          bank: sepayData.bank,
          transferDescription: sepayData.transferDescription,
        })
        window.location.href = `/checkout/sepay?code=${encodeURIComponent(sepayData.paymentCode)}`
        return
      }

      const payosRes = await fetch('/api/payments/payos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          cart: cartCheck.data,
          language,
          productNames,
          buyerName: billingCheck.data.fullName,
          buyerEmail: billingCheck.data.email,
          buyerPhone: billingCheck.data.phone,
          buyerAddress: [billingCheck.data.address, billingCheck.data.city]
            .filter(Boolean)
            .join(', '),
        }),
      })
      const payosData = await payosRes.json()

      if (payosRes.ok && payosData.checkoutUrl) {
        savePayosPendingCheckout(cart, productNames, payosData.orderCode)
        window.location.href = payosData.checkoutUrl
        return
      }

      if (payosData.demo && process.env.NODE_ENV === 'development') {
        const { invoice, accounts } = await completePurchase(
          currentUser.id,
          cart,
          productNames,
          'payos',
          {
            userEmail: currentUser.email,
            userName: currentUser.fullName,
            language,
          },
        )
        setNewInvoice(invoice)
        setUserInvoices([invoice, ...userInvoices])
        setPurchasedAccounts([...accounts, ...purchasedAccounts])
        setOrderPlaced(true)
        setCart(null)
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        return
      }

      throw new Error(payosData.error || t('checkout.orderFailed', language))
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : t('checkout.orderFailed', language))
    } finally {
      setLoading(false)
    }
  }

  if (orderPlaced && newInvoice) {
    return (
      <AppLayout>
        <section className="bg-netflix-black min-h-screen py-12 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            <PaymentSuccessView language={language} active>
              <div className="glass-dark rounded-2xl p-6 border border-white/10 text-left space-y-3 w-full">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('checkout.orderId', language)}</span>
                  <span className="text-white font-mono">{newInvoice.invoiceNumber || newInvoice.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('checkout.amount', language)}</span>
                  <span className="text-white font-bold">{formatCurrency(newInvoice.totalAmount)}</span>
                </div>
              </div>
            </PaymentSuccessView>
          </motion.div>
        </section>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-netflix-red hover:text-red-400 mb-4"
            >
              <ArrowLeft size={20} />
              {t('checkout.backCart', language)}
            </Link>
            <h1 className="text-4xl font-bold text-white">{t('checkout.title', language)}</h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold text-white mb-4">{t('checkout.billingInfo', language)}</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={t('profile.fullName', language)}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red"
                    required
                  />
                  <input
                    type="email"
                    placeholder={t('profile.email', language)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red"
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t('profile.phone', language)}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('profile.address', language)}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('profile.city', language)}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-dark rounded-2xl p-6 border border-netflix-red/30"
              >
                <h2 className="text-xl font-bold text-white mb-4">{t('checkout.selectPayment', language)}</h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer border transition-colors ${
                      paymentMethod === 'payos'
                        ? 'bg-netflix-red/10 border-netflix-red/40'
                        : 'bg-black/20 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="payos"
                      checked={paymentMethod === 'payos'}
                      onChange={() => setPaymentMethod('payos')}
                      className="accent-netflix-red"
                    />
                    <Smartphone size={28} className="text-netflix-red shrink-0" />
                    <div>
                      <p className="text-white font-semibold">{t('checkout.payos', language)}</p>
                      <p className="text-gray-400 text-sm">{t('checkout.payosDesc', language)}</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer border transition-colors ${
                      paymentMethod === 'sepay'
                        ? 'bg-netflix-red/10 border-netflix-red/40'
                        : 'bg-black/20 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="sepay"
                      checked={paymentMethod === 'sepay'}
                      onChange={() => setPaymentMethod('sepay')}
                      className="accent-netflix-red"
                    />
                    <Building2 size={28} className="text-netflix-red shrink-0" />
                    <div>
                      <p className="text-white font-semibold">{t('checkout.sepay', language)}</p>
                      <p className="text-gray-400 text-sm">{t('checkout.sepayDesc', language)}</p>
                    </div>
                  </label>
                </div>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-6 border border-white/10 h-fit sticky top-20"
            >
              <h2 className="text-xl font-bold text-white mb-6">{t('checkout.orderSummary', language)}</h2>
              <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                {cart.items.map((item) => {
                  const product = getById(item.productId)
                  const name = product
                    ? getLocalizedProductName(product.id, product.name, language)
                    : item.productName || t('checkout.product', language)
                  return (
                    <div key={item.id} className="flex justify-between text-sm gap-2">
                      <span className="text-gray-400">
                        {name} · {item.slots || 1} {t('marketplace.slots', language)} ·{' '}
                        {planLabel(item.planType as PlanType, language)}
                      </span>
                      <span className="text-white shrink-0">{formatCurrency(item.price)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>{t('cart.subtotal', language)}</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>{t('cart.discount', language)}</span>
                    <span>-{formatCurrency(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/10">
                  <span>{t('cart.total', language)}</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>
              {orderError && <p className="text-red-400 text-sm mb-3">{orderError}</p>}
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full btn-primary-red py-3 disabled:opacity-50"
              >
                {loading
                  ? t('checkout.processing', language)
                  : paymentMethod === 'sepay'
                    ? t('checkout.payWithSepay', language)
                    : t('checkout.payWithPayos', language)}
              </button>
              <p className="text-gray-500 text-xs text-center mt-4">{t('checkout.payosSecure', language)}</p>
            </motion.div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
