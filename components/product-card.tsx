'use client'

import Link from 'next/link'
import { Product } from '@/lib/types'
import { getLocalizedProduct } from '@/lib/products-i18n'
import { formatCurrency, calculateDiscount } from '@/lib/utils/format'
import { calcPriceBySlots } from '@/lib/inventory/pool'
import { isProductPurchasable } from '@/lib/products/catalog'
import { t, type Lang } from '@/lib/translations'
import { motion } from 'framer-motion'
import { Star, ChevronRight } from 'lucide-react'

interface ProductCardProps {
  product: Product
  language?: Lang
}

export function ProductCard({ product, language = 'vi' }: ProductCardProps) {
  const localized = getLocalizedProduct(product, language)
  const base = product.discountPercentage
    ? calculateDiscount(product.basePrice, product.discountPercentage)
    : product.basePrice
  const fromPrice = calcPriceBySlots(base, 1, 'monthly')
  const purchasable = isProductPurchasable(product)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Link
        href={`/marketplace/${product.id}`}
        className="group block h-full glass-dark rounded-2xl overflow-hidden border border-white/10 hover:border-netflix-red/50 transition-all duration-300"
      >
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-netflix-dark to-black">
          <img
            src={product.image}
            alt={localized.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          {product.comingSoon && (
            <div className="absolute top-3 left-3 bg-amber-500/90 text-black px-3 py-1 rounded-full text-xs font-bold uppercase">
              {t('marketplace.comingSoon', language)}
            </div>
          )}
          {product.discountPercentage && purchasable && (
            <div className="absolute top-3 right-3 bg-netflix-red text-white px-3 py-1 rounded-full text-sm font-bold">
              -{product.discountPercentage}%
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
          <span className="text-xs text-netflix-red font-semibold uppercase tracking-wider mb-2">
            {localized.category}
          </span>

          <h3 className="text-white font-bold text-lg mb-2 group-hover:text-netflix-red transition-colors line-clamp-2">
            {localized.name}
          </h3>

          <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{localized.description}</p>

          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < 4 ? 'fill-netflix-red text-netflix-red' : 'text-gray-600'}
              />
            ))}
            <span className="text-gray-400 text-xs ml-2">(4.2)</span>
          </div>

          <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-white/10">
            <div>
              {purchasable ? (
                <>
                  <p className="text-xs text-gray-500">{t('productDetail.fromPrice', language)}</p>
                  <span className="text-xl font-bold text-white">{formatCurrency(fromPrice)}</span>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500">{t('marketplace.estimatedPrice', language)}</p>
                  <span className="text-lg font-bold text-gray-400">{formatCurrency(base)}</span>
                </>
              )}
            </div>
            <span className="flex items-center gap-1 text-netflix-red text-sm font-semibold group-hover:gap-2 transition-all">
              {purchasable ? t('productDetail.viewDetail', language) : t('marketplace.comingSoon', language)}
              <ChevronRight size={18} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
