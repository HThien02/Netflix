'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Cart, CartItem } from '@/lib/types'
import { calcPriceBySlots } from '@/lib/inventory/pool'
import {
  isShortTermPlan,
  SHORT_TERM_PLANS,
  LONG_TERM_PLANS,
  planExpiryDescription,
  planLabel,
  type PlanType,
} from '@/lib/plans'
import { calculateDiscount, formatCurrency } from '@/lib/utils/format'
import { t, type Lang } from '@/lib/translations'
import { ShoppingCart, Clock } from 'lucide-react'
import { isProductPurchasable } from '@/lib/products/catalog'
import { v4 as uuidv4 } from 'uuid'
import { validateClient } from '@/lib/validation/client'
import { cartSchema } from '@/lib/validation/cart'

type Props = {
  product: Product
  language: Lang
  userId?: string
  isAuthenticated: boolean
  onAddToCart: (cart: Cart) => void
}

export function ProductPurchasePanel({
  product,
  language,
  userId,
  isAuthenticated,
  onAddToCart,
}: Props) {
  const router = useRouter()
  const purchasable = isProductPurchasable(product)
  const [rentalMode, setRentalMode] = useState<'short' | 'long'>('long')
  const [planType, setPlanType] = useState<PlanType>('monthly')
  const [availableSlots, setAvailableSlots] = useState<number[]>([1, 2, 3, 4])
  const [selectedSlots, setSelectedSlots] = useState(1)
  const [addError, setAddError] = useState('')

  const shortTerm = isShortTermPlan(planType)

  useEffect(() => {
    if (rentalMode === 'short') {
      setAvailableSlots([1])
      setPlanType('daily_1')
      setSelectedSlots(1)
      return
    }
    fetch('/api/inventory/slot-options')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.options) && d.options.length) {
          setAvailableSlots(d.options)
          setSelectedSlots(d.options[0] || 1)
        }
      })
      .catch(() => {})
  }, [rentalMode])

  useEffect(() => {
    if (rentalMode === 'long' && shortTerm) setPlanType('monthly')
  }, [rentalMode, shortTerm])

  const basePrice = product.discountPercentage
    ? calculateDiscount(product.basePrice, product.discountPercentage)
    : product.basePrice

  const slots = shortTerm ? 1 : selectedSlots
  const price = calcPriceBySlots(basePrice, slots, planType)
  const expiryNote = useMemo(
    () => planExpiryDescription(new Date(), planType, language),
    [planType, language],
  )

  const handleAdd = () => {
    setAddError('')
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const cartItem: CartItem = {
      id: uuidv4(),
      productId: product.id,
      quantity: 1,
      planType,
      slots,
      price,
      productName: product.name,
    }

    const nextCart: Cart = {
      id: uuidv4(),
      userId: userId || 'user-1',
      items: [cartItem],
      subtotal: price,
      taxAmount: 0,
      discount: 0,
      total: price,
      updatedAt: new Date(),
    }

    const valid = validateClient(cartSchema, nextCart, language)
    if (!valid.success) {
      setAddError(valid.error)
      return
    }

    onAddToCart(valid.data)
    router.push('/cart')
  }

  if (!purchasable) {
    return (
      <div className="glass-dark rounded-2xl p-6 md:p-8 border border-amber-500/30 bg-amber-950/20">
        <div className="flex items-start gap-3">
          <Clock className="text-amber-400 shrink-0 mt-0.5" size={28} />
          <div>
            <p className="text-amber-300 font-bold text-lg">{t('marketplace.comingSoon', language)}</p>
            <p className="text-gray-400 text-sm mt-2">{t('marketplace.comingSoonDesc', language)}</p>
            <p className="text-gray-500 text-xs mt-4">
              {t('marketplace.estimatedPrice', language)}: {formatCurrency(product.basePrice)} /{' '}
              {t('marketplace.monthly', language)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-dark-red-edge-soft rounded-2xl p-6 md:p-8 space-y-6">
      <div>
        <p className="text-gray-400 text-sm mb-1">{t('productDetail.price', language)}</p>
        <p className="text-4xl font-bold text-white">{formatCurrency(price)}</p>
        {product.discountPercentage && (
          <p className="text-gray-500 text-sm line-through mt-1">
            {formatCurrency(calcPriceBySlots(product.basePrice, slots, planType))}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">{expiryNote}</p>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-2">{t('productDetail.rentalType', language)}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRentalMode('short')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              rentalMode === 'short' ? 'bg-netflix-red text-white' : 'bg-white/10 text-gray-300'
            }`}
          >
            {t('marketplace.rentalShort', language)}
          </button>
          <button
            type="button"
            onClick={() => setRentalMode('long')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              rentalMode === 'long' ? 'bg-netflix-red text-white' : 'bg-white/10 text-gray-300'
            }`}
          >
            {t('marketplace.rentalLong', language)}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-2">{t('productDetail.duration', language)}</p>
        <div className="flex flex-wrap gap-2">
          {(rentalMode === 'short' ? SHORT_TERM_PLANS : LONG_TERM_PLANS).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPlanType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                planType === type
                  ? 'bg-netflix-red text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {planLabel(type, language)}
            </button>
          ))}
        </div>
      </div>

      <div className={shortTerm ? 'opacity-50 pointer-events-none' : ''}>
        <p className="text-sm text-gray-400 mb-2">{t('marketplace.selectSlots', language)}</p>
        {shortTerm && (
          <p className="text-xs text-amber-400/90 mb-2">{t('marketplace.shortNoSlots', language)}</p>
        )}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => {
            const available = !shortTerm && availableSlots.includes(n)
            return (
              <button
                key={n}
                type="button"
                disabled={shortTerm || !available}
                onClick={() => available && setSelectedSlots(n)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  selectedSlots === n && available
                    ? 'bg-netflix-red text-white'
                    : available
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>

      {addError && <p className="text-red-400 text-sm">{addError}</p>}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!shortTerm && !availableSlots.includes(selectedSlots)}
        className="w-full btn-primary-red py-4 flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <ShoppingCart size={20} />
        {t('marketplace.addToCart', language)}
      </button>
    </div>
  )
}
