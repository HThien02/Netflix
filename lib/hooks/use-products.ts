'use client'

import { useCallback, useEffect, useState } from 'react'
import { mockProducts } from '@/lib/mock-data'
import type { Product } from '@/lib/types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(mockProducts.filter((p) => p.active))
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    return fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.products) && d.products.length > 0) {
          setProducts(d.products)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const getById = useCallback(
    (id: string | undefined) => (id ? products.find((p) => p.id === id) : undefined),
    [products],
  )

  return { products, loading, reload, getById }
}
