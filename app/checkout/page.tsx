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
import { completePurchase } from '@/lib/orders/complete-purchase'
import { Invoice } from '@/lib/types'
import { motion } from 'framer-motion'
import { ArrowLeft, Smartphone, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'

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
    setLoading(true)
    setOrderError('')

    const productNames = buildProductNames()

    try {
      const payosRes = await fetch('/api/payments/payos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          cart,
          userId: currentUser.id,
          language,
          productNames,
          buyerName: fullName,
          buyerEmail: email,
          buyerPhone: phone,
          buyerAddress: [address, city].filter(Boolean).join(', '),
        }),
      })
      const payosData = await payosRes.json()

      if (payosRes.ok && payosData.checkoutUrl) {
        savePayosPendingCheckout(cart, productNames, payosData.orderCode)
        window.location.href = payosData.checkoutUrl
        return
      }

      if (payosData.demo) {
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
            className="text-center max-w-md"
          >
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-2">{t('checkout.confirmed', language)}</h1>
            <p className="text-gray-400 mb-8">{t('checkout.confirmedDesc', language)}</p>
            <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('checkout.orderId', language)}</span>
                <span className="text-white font-mono">{newInvoice.invoiceNumber || newInvoice.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('checkout.amount', language)}</span>
                <span className="text-white font-bold">{formatCurrency(newInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('checkout.method', language)}</span>
                <span className="text-white">{t('checkout.payos', language)}</span>
              </div>
            </div>
            <Link href="/my-accounts" className="block btn-primary-red py-3 mb-3">
              {t('checkout.viewAccounts', language)}
            </Link>
            <Link href="/marketplace" className="block text-gray-400 hover:text-white">
              {t('checkout.continueShop', language)}
            </Link>
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
            <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
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
                <h2 className="text-xl font-bold text-white mb-2">{t('checkout.paymentMethod', language)}</h2>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-netflix-red/10 border border-netflix-red/40">
                  <Smartphone size={28} className="text-netflix-red" />
                  <div>
                    <p className="text-white font-semibold">{t('checkout.payos', language)}</p>
                    <p className="text-gray-400 text-sm">{t('checkout.payosDesc', language)}</p>
                  </div>
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
                <div className="flex justify-between text-gray-400">
                  <span>{t('cart.tax', language)}</span>
                  <span>{formatCurrency(cart.taxAmount)}</span>
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
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full btn-primary-red py-3 disabled:opacity-50"
              >
                {loading ? t('checkout.processing', language) : t('checkout.payWithPayos', language)}
              </button>
              <p className="text-gray-500 text-xs text-center mt-4">{t('checkout.payosSecure', language)}</p>
            </motion.div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
