'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { Product } from '@/lib/types'
import { AdminShell, adminHeaders } from '@/components/admin/admin-shell'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { planLabel } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'
import { Ban } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

type SlotAssignment = { slot_number: number; profile_name: string; pin?: string }

type Rental = {
  id: string
  product_id?: string | null
  product_name: string
  plan_type: string
  service_email: string
  pool_account_id?: string | null
  slot_assignments?: SlotAssignment[] | unknown
  slots_count: number
  expires_at: string
  status: string
  products?: { id: string; name: string } | { id: string; name: string }[] | null
  users?: { email: string; full_name: string } | { email: string; full_name: string }[]
}

type BanReason = {
  id: string
  code: string
  title_vi: string
  title_en: string
  is_active: boolean
}

function parseSlots(raw: unknown): SlotAssignment[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s, i) => ({
    slot_number: Number((s as SlotAssignment).slot_number) || i + 1,
    profile_name: String((s as SlotAssignment).profile_name || `Profile ${i + 1}`),
    pin: (s as SlotAssignment).pin ? String((s as SlotAssignment).pin) : undefined,
  }))
}

export default function AdminRentalsPage() {
  const { currentUser, language } = useApp()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [reasons, setReasons] = useState<BanReason[]>([])
  const [loading, setLoading] = useState(true)
  const [banTarget, setBanTarget] = useState<Rental | null>(null)
  const [banReasonId, setBanReasonId] = useState('')
  const [banNote, setBanNote] = useState('')
  const [msg, setMsg] = useState('')
  const [catalog, setCatalog] = useState<Product[]>([])
  const [filterProductId, setFilterProductId] = useState('')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('productId')
    if (p) setFilterProductId(p)
  }, [])

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const rentalsUrl = filterProductId
        ? `/api/admin/rentals?productId=${filterProductId}`
        : '/api/admin/rentals'
      const [rRes, bRes, pRes] = await Promise.all([
        fetch(rentalsUrl, { headers: adminHeaders(currentUser.id) }),
        fetch('/api/admin/ban-reasons', { headers: adminHeaders(currentUser.id) }),
        fetch('/api/admin/products', { headers: adminHeaders(currentUser.id) }),
      ])
      const rData = await rRes.json()
      const bData = await bRes.json()
      const pData = await pRes.json()
      if (rRes.ok) setRentals(rData.rentals || [])
      if (bRes.ok) setReasons((bData.reasons || []).filter((x: BanReason) => x.is_active))
      if (pRes.ok) setCatalog(pData.products || [])
    } finally {
      setLoading(false)
    }
  }, [currentUser, filterProductId])

  useEffect(() => {
    load()
  }, [load])

  const userOf = (r: Rental) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users
    return u
  }

  const profileSummary = (r: Rental) => {
    const slots = parseSlots(r.slot_assignments)
    if (slots.length) {
      return slots
        .map((s) => `${s.profile_name} (#${s.slot_number}${s.pin ? ` PIN ${s.pin}` : ''})`)
        .join(', ')
    }
    return r.slots_count > 0 ? `${r.slots_count} slot` : '—'
  }

  const confirmBan = async () => {
    if (!currentUser || !banTarget || !banReasonId) return
    const res = await fetch(`/api/admin/rentals/${banTarget.id}/ban`, {
      method: 'POST',
      headers: adminHeaders(currentUser.id),
      body: JSON.stringify({
        adminUserId: currentUser.id,
        banReasonId,
        adminNote: banNote,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(t('admin.banSuccess', language))
      setBanTarget(null)
      setBanNote('')
      load()
    } else setMsg(data.error || 'Error')
  }

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-white mb-2">{t('admin.rentals', language)}</h1>
      <p className="text-gray-400 mb-6">{t('admin.rentalsDesc', language)}</p>
      {msg && <p className="text-amber-400 text-sm mb-4">{msg}</p>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-400">{t('admin.filterByProduct', language)}</label>
        <select
          value={filterProductId}
          onChange={(e) => setFilterProductId(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[200px]"
        >
          <option value="">{t('admin.allProducts', language)}</option>
          {catalog.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">{t('common.loading', language)}</p>
      ) : rentals.length === 0 ? (
        <p className="text-gray-500">{t('admin.noRentals', language)}</p>
      ) : (
        <div className="overflow-x-auto glass-dark rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="text-gray-500 border-b border-white/10">
              <tr>
                <th className="p-4">{t('admin.customer', language)}</th>
                <th className="p-4">{t('admin.poolAccount', language)}</th>
                <th className="p-4">{t('admin.profilesInUse', language)}</th>
                <th className="p-4">{t('admin.product', language)}</th>
                <th className="p-4">{t('admin.plan', language)}</th>
                <th className="p-4">{t('admin.expires', language)}</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => {
                const u = userOf(r)
                const prod = Array.isArray(r.products) ? r.products[0] : r.products
                const productLabel = prod?.name || r.product_name
                return (
                  <tr key={r.id} className="border-b border-white/5 text-gray-300">
                    <td className="p-4">
                      <p className="text-white">{u?.full_name || '—'}</p>
                      <p className="text-xs text-gray-500">{u?.email}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-400 max-w-[180px] break-all">
                      {r.service_email}
                      {r.pool_account_id && (
                        <span className="block text-gray-600 mt-1 truncate" title={r.pool_account_id}>
                          ID: {r.pool_account_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-amber-200/90 max-w-[220px]">
                      {profileSummary(r)}
                    </td>
                    <td className="p-4">
                      <span className="text-white">{productLabel}</span>
                      {r.product_id && (
                        <span className="block text-gray-600 text-xs truncate max-w-[120px]" title={r.product_id}>
                          {r.product_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="p-4">{planLabel(r.plan_type as PlanType, language)}</td>
                    <td className="p-4">{formatDate(new Date(r.expires_at))}</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setBanTarget(r)
                          setBanReasonId(reasons[0]?.id || '')
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-xs font-bold"
                      >
                        <Ban size={14} /> {t('admin.ban', language)}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-dark rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">{t('admin.banTitle', language)}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {userOf(banTarget)?.email} — {banTarget.product_name}
            </p>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.banReason', language)}</label>
            <select
              value={banReasonId}
              onChange={(e) => setBanReasonId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white mb-3"
            >
              {reasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {language === 'vi' ? reason.title_vi : reason.title_en}
                </option>
              ))}
            </select>
            <label className="block text-xs text-gray-400 mb-1">{t('admin.banNote', language)}</label>
            <textarea
              value={banNote}
              onChange={(e) => setBanNote(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white mb-4"
              placeholder={t('admin.banNotePlaceholder', language)}
            />
            <p className="text-xs text-gray-500 mb-4">{t('admin.banEmailHint', language)}</p>
            <div className="flex gap-2">
              <button
                onClick={confirmBan}
                className="flex-1 bg-netflix-red text-white font-bold py-2 rounded-lg"
              >
                {t('admin.confirmBan', language)}
              </button>
              <button
                onClick={() => setBanTarget(null)}
                className="flex-1 bg-white/10 text-white py-2 rounded-lg"
              >
                {t('common.cancel', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
