'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatCurrency } from '@/lib/utils/format'
import { mockProducts, mockInvoices } from '@/lib/mock-data'
import { Invoice } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CreditCard, Smartphone, Wallet, CheckCircle2, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import confetti from 'canvas-confetti'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, currentUser, language, setCart } = useApp()
  const [paymentMethod, setPaymentMethod] = useState<'payos' | 'credit_card' | 'wallet'>('payos')
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [newInvoice, setNewInvoice] = useState<Invoice | null>(null)

  // Form state for credit card
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVV, setCardCVV] = useState('')

  // Form state for billing info
  const [email, setEmail] = useState(currentUser?.email || '')
  const [fullName, setFullName] = useState(currentUser?.fullName || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

  if (!cart || !currentUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">Invalid checkout session</p>
          <Link href="/marketplace" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Back to Marketplace
          </Link>
        </div>
      </AppLayout>
    )
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      // Create invoice
      const invoice: Invoice = {
        id: `inv-${uuidv4().slice(0, 8)}`,
        userId: currentUser.id,
        subscriptionId: `sub-${uuidv4().slice(0, 8)}`,
        amount: cart.subtotal,
        taxAmount: cart.taxAmount,
        totalAmount: cart.total,
        status: 'paid',
        paymentMethod,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paidDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setNewInvoice(invoice)
      setOrderPlaced(true)
      setCart(null)

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      setLoading(false)
    }, 2000)
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="mb-6 flex justify-center"
            >
              <CheckCircle2 size={80} className="text-green-500" />
            </motion.div>

            <h1 className="text-4xl font-bold text-white mb-2">Order Confirmed!</h1>
            <p className="text-gray-400 mb-8">
              Thank you for your purchase. Your subscription will be activated immediately.
            </p>

            {/* Order Details */}
            <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-6 text-left">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID</span>
                  <span className="text-white font-mono">{newInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-bold">{formatCurrency(newInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-white capitalize">{paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400 font-semibold">Paid</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/subscriptions"
                className="w-full block bg-netflix-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                View My Subscriptions
              </Link>
              <Link
                href="/marketplace"
                className="w-full block bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Email Confirmation */}
            <p className="text-gray-500 text-sm mt-8">
              Confirmation email sent to <span className="text-gray-300">{email}</span>
            </p>
          </motion.div>
        </section>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/cart" className="inline-flex items-center gap-2 text-netflix-red hover:text-red-400 mb-4">
              <ArrowLeft size={20} />
              Back to Cart
            </Link>
            <h1 className="text-4xl font-bold text-white">{t('checkout.title', language)}</h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
              {/* Billing Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold text-white mb-4">{t('checkout.billingInfo', language)}</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                    required
                  />
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold text-white mb-4">{t('checkout.paymentMethod', language)}</h2>
                <div className="space-y-3">
                  {[
                    { id: 'payos', label: 'PayOS', icon: Smartphone },
                    { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
                    { id: 'wallet', label: 'Digital Wallet', icon: Wallet },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id as any)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
                        paymentMethod === id
                          ? 'bg-netflix-red/20 border-netflix-red'
                          : 'bg-black/30 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Icon size={24} className={paymentMethod === id ? 'text-netflix-red' : 'text-gray-400'} />
                      <span className={paymentMethod === id ? 'text-netflix-red font-semibold' : 'text-white'}>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Credit Card Form */}
                <AnimatePresence>
                  {paymentMethod === 'credit_card' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/10 space-y-4"
                    >
                      <input
                        type="text"
                        placeholder="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                        required={paymentMethod === 'credit_card'}
                      />
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').slice(0, 16))}
                        maxLength={16}
                        className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors font-mono"
                        required={paymentMethod === 'credit_card'}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                          className="bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                          required={paymentMethod === 'credit_card'}
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          value={cardCVV}
                          onChange={(e) => setCardCVV(e.target.value.slice(0, 3))}
                          maxLength={3}
                          className="bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
                          required={paymentMethod === 'credit_card'}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </form>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-6 border border-white/10 h-fit sticky top-20"
            >
              <h2 className="text-xl font-bold text-white mb-6">{t('checkout.orderSummary', language)}</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                {cart.items.map((item) => {
                  const product = mockProducts.find(p => p.id === item.productId)
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-400">{product?.name || 'Product'}</span>
                      <span className="text-white">{formatCurrency(item.price)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax</span>
                  <span>{formatCurrency(cart.taxAmount)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-netflix-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
              >
                {loading ? 'Processing...' : t('checkout.placeOrder', language)}
              </button>

              {/* Security Badge */}
              <p className="text-gray-500 text-xs text-center mt-4">
                Secured by SSL Encryption
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
