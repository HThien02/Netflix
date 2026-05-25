'use client'

import React from 'react'
import { Product } from '@/lib/types'
import { formatCurrency, calculateDiscount } from '@/lib/utils/format'
import { motion } from 'framer-motion'
import { ShoppingCart, Star } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  planType?: 'monthly' | 'quarterly' | 'annual'
}

export function ProductCard({ product, onAddToCart, planType = 'monthly' }: ProductCardProps) {
  const discountedPrice = product.discountPercentage
    ? calculateDiscount(product.basePrice, product.discountPercentage)
    : product.basePrice

  const planMultipliers = {
    monthly: 1,
    quarterly: 2.8,
    annual: 10,
  }

  const finalPrice = discountedPrice * planMultipliers[planType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group h-full"
    >
      <div className="glass-dark rounded-2xl overflow-hidden border border-white/10 hover:border-netflix-red/50 transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-netflix-dark to-black">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.discountPercentage && (
            <div className="absolute top-3 right-3 bg-netflix-red text-white px-3 py-1 rounded-full text-sm font-bold">
              -{product.discountPercentage}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category */}
          <span className="text-xs text-netflix-red font-semibold uppercase tracking-wider mb-2">
            {product.category}
          </span>

          {/* Title */}
          <h3 className="text-white font-bold text-lg mb-2 group-hover:text-netflix-red transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

          {/* Rating */}
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

          {/* Pricing */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-white">
                {formatCurrency(finalPrice)}
              </span>
              {product.discountPercentage && (
                <span className="text-gray-500 line-through text-sm">
                  {formatCurrency(product.basePrice * planMultipliers[planType])}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {planType === 'monthly' && 'per month'}
              {planType === 'quarterly' && 'per 3 months'}
              {planType === 'annual' && 'per year'}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn"
          >
            <ShoppingCart size={18} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
