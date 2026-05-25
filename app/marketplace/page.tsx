'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { ProductCard } from '@/components/product-card'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { mockProducts, mockMerchants } from '@/lib/mock-data'
import { Product, CartItem, Cart } from '@/lib/types'
import { motion } from 'framer-motion'
import { Search, Filter, Grid3x3, List } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function MarketplacePage() {
  const router = useRouter()
  const { setCart, isAuthenticated, language } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [planType, setPlanType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all')

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMerchant = selectedMerchant === 'all' || product.merchantId === selectedMerchant
      return matchesSearch && matchesMerchant
    })
  }, [searchQuery, selectedMerchant])

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const cartItem: CartItem = {
      id: uuidv4(),
      productId: product.id,
      quantity: 1,
      planType,
      price: product.basePrice,
    }

    const newCart: Cart = {
      id: uuidv4(),
      userId: 'user-1',
      items: [cartItem],
      subtotal: cartItem.price,
      taxAmount: cartItem.price * 0.1,
      discount: 0,
      total: cartItem.price * 1.1,
      updatedAt: new Date(),
    }

    setCart(newCart)
    router.push('/cart')
  }

  return (
    <AppLayout>
      {/* Header */}
      <section className="bg-gradient-to-b from-netflix-dark-light to-netflix-black border-b border-netflix-dark py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {t('marketplace.title', language)}
            </h1>
            <p className="text-gray-400">{t('marketplace.subtitle', language)}</p>
          </motion.div>

          {/* Search & Filter Bar */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('marketplace.search', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-2">
                {(['monthly', 'quarterly', 'annual'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPlanType(type)}
                    className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                      planType === type
                        ? 'bg-netflix-red text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {type === 'monthly' && t('marketplace.monthly', language)}
                    {type === 'quarterly' && t('marketplace.quarterly', language)}
                    {type === 'annual' && t('marketplace.annual', language)}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-netflix-red text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  <Grid3x3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-netflix-red text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            {/* Merchant Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedMerchant('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                  selectedMerchant === 'all'
                    ? 'bg-netflix-red/20 text-netflix-red border border-netflix-red'
                    : 'bg-white/10 text-gray-300 border border-white/10 hover:border-white/20'
                }`}
              >
                All Stores
              </button>
              {mockMerchants.map((merchant) => (
                <button
                  key={merchant.id}
                  onClick={() => setSelectedMerchant(merchant.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                    selectedMerchant === merchant.id
                      ? 'bg-netflix-red/20 text-netflix-red border border-netflix-red'
                      : 'bg-white/10 text-gray-300 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {merchant.storeName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid/List */}
      <section className="py-12 bg-netflix-black">
        <div className="container mx-auto px-4">
          {filteredProducts.length > 0 ? (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  planType={planType}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="text-gray-400 mb-4">
                <p className="text-xl font-semibold mb-2">No products found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured Merchants */}
      <section className="py-16 bg-netflix-dark border-t border-netflix-dark">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-2">Featured Merchants</h2>
            <p className="text-gray-400">Trusted partners providing premium content</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockMerchants.map((merchant) => (
              <motion.div
                key={merchant.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="glass-dark rounded-2xl p-6 border border-white/10 hover:border-netflix-red/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{merchant.storeName}</h3>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < Math.floor(merchant.rating) ? 'text-netflix-red' : 'text-gray-600'}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="text-gray-400 text-sm">{merchant.rating}/5</span>
                    </div>
                  </div>
                  {merchant.isVerified && (
                    <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                      Verified
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4">{merchant.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Sales</p>
                    <p className="text-white font-bold">{merchant.totalSales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="text-white font-bold">${(merchant.totalRevenue / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
