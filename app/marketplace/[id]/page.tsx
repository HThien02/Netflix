'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { ProductPurchasePanel } from '@/components/product-purchase-panel'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { mockMerchants } from '@/lib/mock-data'
import { useProducts } from '@/lib/hooks/use-products'
import { getLocalizedProduct } from '@/lib/products-i18n'
import { formatCurrency, calculateDiscount } from '@/lib/utils/format'
import { calcPriceBySlots } from '@/lib/inventory/pool'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Check } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const { language, setCart, isAuthenticated, currentUser } = useApp()
  const productId = typeof params.id === 'string' ? params.id : params.id?.[0]
  const { getById, loading } = useProducts()
  const product = getById(productId)
  const merchant = product ? mockMerchants.find((m) => m.id === product.merchantId) : null
  const localized = product ? getLocalizedProduct(product, language) : null

  if (loading && !product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center text-gray-400">
          {t('common.loading', language)}
        </div>
      </AppLayout>
    )
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">{t('productDetail.notFound', language)}</p>
          <Link href="/marketplace" className="text-netflix-red hover:underline">
            {t('productDetail.backMarketplace', language)}
          </Link>
        </div>
      </AppLayout>
    )
  }

  const base = product.discountPercentage
    ? calculateDiscount(product.basePrice, product.discountPercentage)
    : product.basePrice
  const fromPrice = calcPriceBySlots(base, 1, 'monthly')

  const features = [
    t('productDetail.feature1', language),
    t('productDetail.feature2', language),
    t('productDetail.feature3', language),
    t('productDetail.feature4', language),
  ]

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            {t('productDetail.backMarketplace', language)}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video lg:aspect-[4/3]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.discountPercentage && (
                  <span className="absolute top-4 right-4 bg-netflix-red text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discountPercentage}%
                  </span>
                )}
              </div>
              {merchant && (
                <p className="text-gray-500 text-sm mt-4">
                  {t('productDetail.soldBy', language)}:{' '}
                  <span className="text-gray-300">{merchant.storeName}</span>
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs text-netflix-red font-semibold uppercase tracking-wider">
                  {localized?.category}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-3">{localized?.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < 4 ? 'fill-netflix-red text-netflix-red' : 'text-gray-600'}
                    />
                  ))}
                  <span className="text-gray-400 text-sm">4.2</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{localized?.description}</p>
                <p className="text-gray-500 text-sm mt-3">
                  {t('productDetail.fromPrice', language)}:{' '}
                  <span className="text-white font-semibold">{formatCurrency(fromPrice)}</span>
                  / {t('marketplace.monthly', language)}
                </p>
              </div>

              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-400 text-sm">
                    <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <ProductPurchasePanel
                product={product}
                language={language}
                userId={currentUser?.id}
                isAuthenticated={isAuthenticated}
                onAddToCart={setCart}
              />
            </motion.div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
