'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminShell, adminHeaders } from '@/components/admin/admin-shell'
import { ProductImageField } from '@/components/admin/product-image-field'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatCurrency } from '@/lib/utils/format'
import { Save, Trash2, Pencil, ExternalLink } from 'lucide-react'

type AdminProduct = {
  id: string
  name: string
  description: string
  nameEn?: string
  descriptionEn?: string
  basePrice: number
  discountPercentage?: number
  category: string
  image: string
  imageStoragePath?: string
  active: boolean
  poolAccountCount?: number
}

const emptyForm = {
  name: '',
  name_en: '',
  description: '',
  description_en: '',
  price: 1000,
  discount_percent: 0,
  category: 'Streaming',
  is_active: true,
}

export default function AdminProductsPage() {
  const { currentUser, language } = useApp()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/admin/products', { headers: adminHeaders(currentUser.id) })
      const data = await res.json()
      if (res.ok) setProducts(data.products || [])
      else setErr(data.error || 'Error')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setForm(emptyForm)
    setEditId(null)
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
  }

  const startEdit = (p: AdminProduct) => {
    setEditId(p.id)
    setForm({
      name: p.name,
      name_en: p.nameEn || '',
      description: p.description,
      description_en: p.descriptionEn || '',
      price: p.basePrice,
      discount_percent: p.discountPercentage || 0,
      category: p.category,
      is_active: p.active,
    })
    setImageFile(null)
    setImagePreview(p.imageStoragePath ? p.image : null)
    setRemoveImage(false)
  }

  const uploadImage = async (productId: string) => {
    if (!currentUser || !imageFile) return true
    const fd = new FormData()
    fd.append('file', imageFile)
    const res = await fetch(`/api/admin/products/${productId}/image`, {
      method: 'POST',
      headers: adminHeaders(currentUser.id),
      body: fd,
    })
    const data = await res.json()
    if (!res.ok) {
      setErr(data.error || 'Upload failed')
      return false
    }
    return true
  }

  const deleteImage = async (productId: string) => {
    if (!currentUser) return true
    const res = await fetch(
      `/api/admin/products/${productId}/image?adminUserId=${encodeURIComponent(currentUser.id)}`,
      {
        method: 'DELETE',
        headers: adminHeaders(currentUser.id),
      },
    )
    const data = await res.json()
    if (!res.ok) {
      setErr(data.error || 'Error')
      return false
    }
    return true
  }

  const save = async () => {
    if (!currentUser || !form.name.trim()) return
    setErr('')
    setSaving(true)
    try {
      const body = { adminUserId: currentUser.id, ...form, basePrice: form.price }
      const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products'
      const res = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: adminHeaders(currentUser.id),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error')
        return
      }

      const productId = editId || data.product?.id
      if (!productId) {
        setErr('Missing product id')
        return
      }

      if (removeImage && !imageFile) {
        const ok = await deleteImage(productId)
        if (!ok) return
      } else if (imageFile) {
        const ok = await uploadImage(productId)
        if (!ok) return
      }

      setMsg(t('admin.saved', language))
      resetForm()
      load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!currentUser || !confirm(t('admin.confirmDelete', language))) return
    const res = await fetch(`/api/admin/products/${id}?adminUserId=${currentUser.id}`, {
      method: 'DELETE',
      headers: adminHeaders(currentUser.id),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(t('admin.productDeleted', language))
      if (editId === id) resetForm()
      load()
    } else setErr(data.error || 'Error')
  }

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-white mb-2">{t('admin.productsManage', language)}</h1>
      <p className="text-gray-400 mb-6">{t('admin.productsManageDesc', language)}</p>
      {msg && <p className="text-green-400 text-sm mb-4">{msg}</p>}
      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}

      <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">
          {editId ? t('admin.editProduct', language) : t('admin.addProduct', language)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            placeholder={t('admin.productNameVi', language)}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            placeholder={t('admin.productNameEn', language)}
            value={form.name_en}
            onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <textarea
            placeholder={t('admin.productDescVi', language)}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm md:col-span-2"
          />
          <textarea
            placeholder={t('admin.productDescEn', language)}
            value={form.description_en}
            onChange={(e) => setForm({ ...form, description_en: e.target.value })}
            rows={2}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm md:col-span-2"
          />
          <input
            type="number"
            min={0}
            placeholder={t('admin.productPrice', language)}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="number"
            min={0}
            max={100}
            placeholder={t('admin.productDiscount', language)}
            value={form.discount_percent}
            onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            placeholder={t('admin.productCategory', language)}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <ProductImageField
            language={language}
            previewUrl={imagePreview}
            disabled={saving}
            onFileSelect={(file) => {
              setImageFile(file)
              setRemoveImage(false)
            }}
            onRemoveExisting={() => {
              setImagePreview(null)
              setRemoveImage(true)
            }}
          />
          <label className="flex items-center gap-2 text-sm text-gray-300 md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded"
            />
            {t('admin.productActive', language)}
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? t('common.loading', language) : editId ? t('admin.save', language) : t('admin.add', language)}
          </button>
          {editId && (
            <button
              onClick={resetForm}
              className="bg-white/10 text-white py-2 px-4 rounded-lg"
            >
              {t('common.cancel', language)}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">{t('common.loading', language)}</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">{t('admin.noProducts', language)}</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="glass-dark rounded-2xl border border-white/10 p-4 flex flex-wrap items-center gap-4"
            >
              <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10">
                <Image src={p.image} alt="" fill className="object-cover" sizes="80px" unoptimized />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold">{p.name}</p>
                <p className="text-gray-500 text-xs line-clamp-1">{p.description}</p>
                <p className="text-netflix-red font-bold mt-1">{formatCurrency(p.basePrice)}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {p.poolAccountCount || 0} {t('admin.poolAccountsForProduct', language)} ·{' '}
                  <span className={p.active ? 'text-green-500' : 'text-gray-500'}>
                    {p.active ? t('admin.productActive', language) : t('admin.productInactive', language)}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/marketplace/${p.id}`}
                  target="_blank"
                  className="p-2 text-gray-400 hover:text-white rounded"
                  title={t('admin.viewOnMarket', language)}
                >
                  <ExternalLink size={18} />
                </Link>
                <Link
                  href={`/admin/pool?productId=${p.id}`}
                  className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30"
                >
                  {t('admin.managePool', language)}
                </Link>
                <Link
                  href={`/admin/rentals?productId=${p.id}`}
                  className="px-3 py-1.5 text-xs bg-amber-600/20 text-amber-300 rounded-lg hover:bg-amber-600/30"
                >
                  {t('admin.viewRentals', language)}
                </Link>
                <button
                  onClick={() => startEdit(p)}
                  className="p-2 text-blue-400 hover:bg-blue-500/10 rounded"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
