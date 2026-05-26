'use client'

import React, { useState, useMemo } from 'react'
import { AppLayout } from '@/components/app-layout'
import { ProductCard } from '@/components/product-card'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { mockMerchants } from '@/lib/mock-data'
import { useProducts } from '@/lib/hooks/use-products'
import { isProductPurchasable } from '@/lib/products/catalog'
import { motion } from 'framer-motion'
import { Search, Grid3x3, List } from 'lucide-react'

export default function MarketplacePage() {
  const { language } = useApp()
  const { products } = useProducts()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all')

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesMerchant =
          selectedMerchant === 'all' || product.merchantId === selectedMerchant
        return matchesSearch && matchesMerchant
      })
      .sort((a, b) => {
        const aOk = isProductPurchasable(a) ? 0 : 1
        const bOk = isProductPurchasable(b) ? 0 : 1
        return aOk - bOk || a.name.localeCompare(b.name)
      })
  }, [searchQuery, selectedMerchant, products])

  return (
    <AppLayout>
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

          <div className="space-y-4">
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

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <p className="text-gray-500 text-sm">{t('productDetail.clickCardHint', language)}</p>
              <div className="flex gap-2">
                <button
                  type="button"
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
                  type="button"
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

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedMerchant('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                  selectedMerchant === 'all'
                    ? 'bg-netflix-red/20 text-netflix-red border border-netflix-red'
                    : 'bg-white/10 text-gray-300 border border-white/10 hover:border-white/20'
                }`}
              >
                {t('marketplace.allStores', language)}
              </button>
              {mockMerchants.map((merchant) => (
                <button
                  key={merchant.id}
                  type="button"
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

      <section className="py-12 bg-netflix-black">
        <div className="container mx-auto px-4">
          {filteredProducts.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} language={language} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 text-gray-400"
            >
              <p className="text-xl font-semibold mb-2">{t('marketplace.noProducts', language)}</p>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-16 bg-netflix-dark border-t border-netflix-dark">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-2">{t('marketplace.featuredMerchants', language)}</h2>
          <p className="text-gray-400 mb-8">{t('marketplace.featuredMerchantsDesc', language)}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockMerchants.map((merchant) => (
              <div
                key={merchant.id}
                className="glass-dark rounded-2xl p-6 border border-white/10 hover:border-netflix-red/50 transition-all"
              >
                <h3 className="text-white font-bold text-lg mb-1">{merchant.storeName}</h3>
                <p className="text-gray-400 text-sm">{merchant.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
