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
import { ChoiceGroup } from '@/components/ui/choice-group'

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

  const slotOptions = [1, 2, 3, 4].map((n) => ({
    value: n,
    label: String(n),
    disabled: shortTerm || !availableSlots.includes(n),
  }))

  return (
    <div className="glass-dark-red-edge-soft rounded-2xl p-6 md:p-8 space-y-6 relative isolate overflow-visible">
      <div className="relative z-10 rounded-xl bg-black/30 border border-white/10 p-4 sm:p-5">
        <p className="text-gray-400 text-sm mb-1">{t('productDetail.price', language)}</p>
        <p className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
          {formatCurrency(price)}
        </p>
        {product.discountPercentage ? (
          <p className="text-gray-500 text-sm line-through mt-1 tabular-nums">
            {formatCurrency(calcPriceBySlots(product.basePrice, slots, planType))}
          </p>
        ) : null}
        <p className="text-xs text-gray-500 mt-2">{expiryNote}</p>
      </div>

      <ChoiceGroup
        label={t('productDetail.rentalType', language)}
        value={rentalMode}
        onChange={setRentalMode}
        options={[
          { value: 'short', label: t('marketplace.rentalShort', language) },
          { value: 'long', label: t('marketplace.rentalLong', language) },
        ]}
      />

      <ChoiceGroup
        label={t('productDetail.duration', language)}
        value={planType}
        onChange={setPlanType}
        columns={3}
        options={(rentalMode === 'short' ? SHORT_TERM_PLANS : LONG_TERM_PLANS).map((type) => ({
          value: type,
          label: planLabel(type, language),
        }))}
      />

      <div className={shortTerm ? 'opacity-50 pointer-events-none' : ''}>
        <ChoiceGroup
          label={t('marketplace.selectSlots', language)}
          hint={shortTerm ? t('marketplace.shortNoSlots', language) : undefined}
          value={selectedSlots}
          onChange={setSelectedSlots}
          columns={4}
          options={slotOptions}
        />
      </div>

      {addError && <p className="text-red-400 text-sm">{addError}</p>}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!shortTerm && !availableSlots.includes(selectedSlots)}
        className="w-full btn-primary-red py-4 flex items-center justify-center gap-2 disabled:opacity-40 relative z-10"
      >
        <ShoppingCart size={20} />
        {t('marketplace.addToCart', language)}
      </button>
    </div>
  )
}
