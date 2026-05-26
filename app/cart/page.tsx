'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { mockCoupons } from '@/lib/mock-data'
import { useProducts } from '@/lib/hooks/use-products'
import { getLocalizedProduct, getLocalizedProductName } from '@/lib/products-i18n'
import { formatCurrency } from '@/lib/utils/format'
import { planLabel } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus, ArrowLeft, CheckCircle } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { cart, setCart, isAuthenticated, language } = useApp()
  const { getById } = useProducts()
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">{t('cart.signIn', language)}</p>
          <Link href="/auth/login" className="btn-primary-red px-6 py-2 inline-block">
            {t('nav.signIn', language)}
          </Link>
        </div>
      </AppLayout>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <AppLayout>
        <section className="bg-netflix-black min-h-screen">
          <div className="container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <h1 className="text-4xl font-bold text-white mb-4">{t('cart.title', language)}</h1>
              <div className="text-gray-400 mb-8">
                <p className="text-xl font-semibold mb-2">{t('cart.empty', language)}</p>
              </div>
              <Link
                href="/marketplace"
                className="inline-block bg-netflix-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                {t('cart.continueShopping', language)}
              </Link>
            </motion.div>
          </div>
        </section>
      </AppLayout>
    )
  }

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = cart.items.filter(item => item.id !== itemId)
    if (updatedItems.length === 0) {
      setCart(null)
    } else {
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const taxAmount = 0
      const currentDiscount = couponApplied ? (subtotal * 0.1) : 0
      setCart({
        ...cart,
        items: updatedItems,
        subtotal,
        taxAmount,
        total: subtotal - currentDiscount,
      })
    }
  }

  const handleApplyCoupon = () => {
    setCouponError('')
    const coupon = mockCoupons.find(c => c.code === couponCode.toUpperCase() && c.active)
    
    if (!coupon) {
      setCouponError(t('cart.invalidCoupon', language))
      return
    }

    if (coupon.minAmount && cart.subtotal < coupon.minAmount) {
      setCouponError(
        `${t('cart.couponMinAmount', language)} ${formatCurrency(coupon.minAmount!)}`,
      )
      return
    }

    let discount = 0
    if (coupon.discountType === 'percentage') {
      discount = (cart.subtotal * coupon.discountValue) / 100
    } else {
      discount = coupon.discountValue
    }

    setCart({
      ...cart,
      discount,
      couponCode: coupon.code,
      taxAmount: 0,
      total: cart.subtotal - discount,
    })
    setCouponApplied(true)
  }

  const handleCheckout = () => {
    router.push('/checkout')
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
            <Link href="/marketplace" className="inline-flex items-center gap-2 text-netflix-red hover:text-red-400 mb-4">
              <ArrowLeft size={20} />
              {t('cart.continueShopping', language)}
            </Link>
            <h1 className="text-4xl font-bold text-white">{t('cart.title', language)}</h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cart.items.map((item, index) => {
                  const product = getById(item.productId)
                  if (!product) return null

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-dark rounded-2xl p-6 border border-white/10 flex gap-6"
                    >
                      {/* Product Image */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-netflix-dark">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-1">
                          {getLocalizedProductName(product.id, product.name, language)}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                          {getLocalizedProduct(product, language).description}
                        </p>
                        <p className="text-gray-500 text-xs mb-1">
                          {item.slots || 1} {t('marketplace.slots', language)} ·{' '}
                          {planLabel(item.planType as PlanType, language)}
                        </p>
                        <div className="text-white font-semibold">{formatCurrency(item.price)}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-4">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-netflix-red transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm mb-1">Qty</p>
                          <p className="text-white font-bold text-lg">{item.quantity}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-6 border border-white/10 h-fit sticky top-20"
            >
              <h2 className="text-xl font-bold text-white mb-6">{t('cart.orderSummary', language)}</h2>

              {/* Coupon Input */}
              <div className="mb-6">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={t('checkout.couponCode', language)}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-black/30 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-netflix-red/20 hover:bg-netflix-red/30 text-netflix-red px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-400 text-xs">{couponError}</p>
                )}
                {couponApplied && (
                  <div className="flex items-center gap-2 text-green-400 text-xs">
                    <CheckCircle size={16} />
                    Coupon applied successfully
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-white/10 pt-6 mb-6">
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

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-netflix-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 mb-4"
              >
                {t('cart.checkout', language)}
              </button>

              {/* Continue Shopping */}
              <Link
                href="/marketplace"
                className="w-full block text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                {t('cart.continueShopping', language)}
              </Link>

              {/* Trust Badge */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
                <p>Secure checkout powered by SSL</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
