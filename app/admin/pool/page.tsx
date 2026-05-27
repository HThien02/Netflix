'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminShell, adminFetch, adminHeaders } from '@/components/admin/admin-shell'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { Plus, Save, Trash2, ChevronDown, ChevronUp, Ban, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { Product } from '@/lib/types'
import { groupBanReasonsByCategory } from '@/lib/ban-reasons/violations-catalog'

type SlotRow = { slot_number: number; profile_name: string; pin?: string }

type SlotUsage = SlotRow & {
  in_use: boolean
  rental_id?: string
  user_email?: string
  user_name?: string
  product_name?: string
  expires_at?: string
}

type PoolRow = {
  id: string
  product_id?: string | null
  product_name?: string | null
  service_email: string
  service_password: string
  max_slots: number
  slots_used: number
  slot_details: SlotRow[]
  slot_usage?: SlotUsage[]
  status: string
  notes?: string
}

type BanReason = {
  id: string
  code: string
  title_vi: string
  title_en: string
  is_active: boolean
}

type BanTarget =
  | { mode: 'account'; account: PoolRow }
  | { mode: 'slot'; account: PoolRow; rentalId: string; slotLabel: string }

function accountMatchesClientSearch(acc: PoolRow, term: string): boolean {
  const q = term.trim().toLowerCase()
  if (!q) return true
  if (acc.service_email.toLowerCase().includes(q)) return true
  if (acc.notes?.toLowerCase().includes(q)) return true
  if (acc.product_name?.toLowerCase().includes(q)) return true
  for (const s of acc.slot_usage || acc.slot_details || []) {
    const row = s as SlotUsage
    if (row.profile_name?.toLowerCase().includes(q)) return true
    if (row.user_email?.toLowerCase().includes(q)) return true
    if (row.user_name?.toLowerCase().includes(q)) return true
  }
  return false
}

export default function AdminPoolPage() {
  const { currentUser, language } = useApp()
  const [filterProductId, setFilterProductId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [accounts, setAccounts] = useState<PoolRow[]>([])
  const [catalog, setCatalog] = useState<Product[]>([])
  const [reasons, setReasons] = useState<BanReason[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [banTarget, setBanTarget] = useState<BanTarget | null>(null)
  const [banReasonId, setBanReasonId] = useState('')
  const [banNote, setBanNote] = useState('')
  const [form, setForm] = useState({
    product_id: '',
    service_email: '',
    service_password: '',
    max_slots: 4,
    slots_used: 0,
    status: 'active',
    notes: '',
  })

  const loadProducts = useCallback(async () => {
    if (!currentUser) return
    const res = await adminFetch('/api/admin/products', currentUser.id)
    const data = await res.json()
    if (res.ok) setCatalog(data.products || [])
  }, [currentUser])

  const loadReasons = useCallback(async () => {
    if (!currentUser) return
    const res = await adminFetch('/api/admin/ban-reasons', currentUser.id)
    const data = await res.json()
    if (res.ok) {
      const active = (data.reasons || []).filter((x: BanReason) => x.is_active)
      setReasons(active)
      setBanReasonId((prev) => prev || active[0]?.id || '')
    }
  }, [currentUser])

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setErr('')
    try {
      const params = new URLSearchParams()
      if (filterProductId) params.set('productId', filterProductId)
      if (filterStatus) params.set('status', filterStatus)
      const q = searchQuery.trim()
      if (q.length >= 2 && q.includes('@')) params.set('q', q)
      const url = `/api/admin/pool${params.toString() ? `?${params}` : ''}`
      const res = await adminFetch(url, currentUser.id)
      const data = await res.json()
      if (res.ok) setAccounts(data.accounts || [])
      else setErr(data.error || t('common.error', language))
    } catch {
      setErr(t('common.error', language))
    } finally {
      setLoading(false)
    }
  }, [currentUser, filterProductId, filterStatus, language])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('productId')
    if (p) {
      setFilterProductId(p)
      setForm((f) => ({ ...f, product_id: p }))
    }
  }, [])

  useEffect(() => {
    load()
    loadProducts()
    loadReasons()
  }, [load, loadProducts, loadReasons])

  const groupedReasons = useMemo(
    () => groupBanReasonsByCategory(reasons, language),
    [reasons, language],
  )

  const visibleAccounts = useMemo(() => {
    const term = searchQuery.trim()
    return accounts.filter((a) => accountMatchesClientSearch(a, term))
  }, [accounts, searchQuery])

  const activeRentalsOnAccount = (acc: PoolRow) =>
    (acc.slot_usage || []).filter((s) => s.in_use && s.rental_id).length

  const saveAccount = async (acc: PoolRow) => {
    if (!currentUser) return
    const res = await adminFetch(`/api/admin/pool/${acc.id}`, currentUser.id, {
      method: 'PATCH',
      headers: adminHeaders(currentUser.id),
      body: JSON.stringify({
        adminUserId: currentUser.id,
        service_email: acc.service_email,
        service_password: acc.service_password,
        max_slots: acc.max_slots,
        slots_used: acc.slots_used,
        slot_details: acc.slot_details,
        status: acc.status,
        notes: acc.notes,
        product_id: acc.product_id || null,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(t('admin.saved', language))
      load()
    } else setMsg(data.error)
  }

  const createAccount = async () => {
    if (!currentUser || !form.service_email) return
    const slots = Array.from({ length: form.max_slots }, (_, i) => ({
      slot_number: i + 1,
      profile_name: `Profile ${i + 1}`,
      pin: `${1000 + i}`,
    }))
    const res = await adminFetch('/api/admin/pool', currentUser.id, {
      method: 'POST',
      headers: adminHeaders(currentUser.id),
      body: JSON.stringify({
        adminUserId: currentUser.id,
        ...form,
        product_id: form.product_id || null,
        slot_details: slots,
      }),
    })
    if (res.ok) {
      setForm({
        product_id: filterProductId,
        service_email: '',
        service_password: '',
        max_slots: 4,
        slots_used: 0,
        status: 'active',
        notes: '',
      })
      load()
    }
  }

  const deleteAccount = async (id: string) => {
    if (!currentUser || !confirm(t('admin.confirmDelete', language))) return
    await adminFetch(`/api/admin/pool/${id}?adminUserId=${currentUser.id}`, currentUser.id, {
      method: 'DELETE',
      headers: adminHeaders(currentUser.id),
    })
    load()
  }

  const updateSlot = (accId: string, idx: number, field: keyof SlotRow, value: string | number) => {
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accId) return a
        const slots = [...(a.slot_details || [])]
        slots[idx] = { ...slots[idx], [field]: value }
        return { ...a, slot_details: slots }
      }),
    )
  }

  const patchAccount = (id: string, patch: Partial<PoolRow>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const usageRows = (acc: PoolRow): SlotUsage[] => {
    if (acc.slot_usage?.length) return acc.slot_usage
    return (acc.slot_details || []).map((s) => ({ ...s, in_use: s.slot_number <= acc.slots_used }))
  }

  const inUseSummary = (acc: PoolRow) => {
    const used = usageRows(acc).filter((s) => s.in_use)
    if (!used.length) return null
    return used
      .map((s) => {
        const who = s.user_email || s.user_name || t('admin.noAssignment', language)
        return `${s.profile_name} → ${who}`
      })
      .join(' · ')
  }

  const openAccountBan = (account: PoolRow) => {
    setBanTarget({ mode: 'account', account })
    setBanReasonId(reasons[0]?.id || '')
    setBanNote('')
  }

  const openSlotBan = (account: PoolRow, slot: SlotUsage) => {
    if (!slot.rental_id) return
    setBanTarget({
      mode: 'slot',
      account,
      rentalId: slot.rental_id,
      slotLabel: `${slot.profile_name} (#${slot.slot_number})`,
    })
    setBanReasonId(reasons[0]?.id || '')
    setBanNote('')
  }

  const confirmBan = async () => {
    if (!currentUser || !banTarget || !banReasonId) return
    const poolId = banTarget.account.id
    const body =
      banTarget.mode === 'slot'
        ? {
            adminUserId: currentUser.id,
            banReasonId,
            adminNote: banNote,
            rentalId: banTarget.rentalId,
            disablePool: false,
          }
        : {
            adminUserId: currentUser.id,
            banReasonId,
            adminNote: banNote,
            disablePool: true,
          }

    const res = await adminFetch(`/api/admin/pool/${poolId}/ban`, currentUser.id, {
      method: 'POST',
      headers: adminHeaders(currentUser.id),
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      const count = typeof data.bannedCount === 'number' ? data.bannedCount : 0
      setMsg(
        count > 0
          ? t('admin.poolBanResult', language).replace('{count}', String(count))
          : t('admin.banSuccess', language),
      )
      setBanTarget(null)
      setBanNote('')
      load()
    } else {
      setMsg(data.error || t('common.error', language))
    }
  }

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-white mb-2">{t('admin.pool', language)}</h1>
      <p className="text-gray-400 mb-6">{t('admin.poolDesc', language)}</p>
      {msg && <p className="text-green-400 text-sm mb-4">{msg}</p>}
      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}

      <div className="glass-dark rounded-2xl p-4 border border-white/10 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-gray-400 mb-1">{t('admin.searchPool', language)}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.searchPoolPlaceholder', language)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.filterByProduct', language)}</label>
          <select
            value={filterProductId}
            onChange={(e) => setFilterProductId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[180px]"
          >
            <option value="">{t('admin.allProducts', language)}</option>
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('admin.filterByStatus', language)}</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[140px]"
          >
            <option value="">{t('admin.allStatuses', language)}</option>
            <option value="active">active</option>
            <option value="full">full</option>
            <option value="disabled">disabled</option>
          </select>
        </div>
        <p className="text-gray-500 text-xs pb-2">
          {visibleAccounts.length} / {accounts.length}
        </p>
      </div>

      <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">{t('admin.addAccount', language)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">{t('admin.selectProduct', language)}</option>
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            placeholder={t('admin.loginEmail', language)}
            value={form.service_email}
            onChange={(e) => setForm({ ...form, service_email: e.target.value })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            placeholder={t('admin.password', language)}
            value={form.service_password}
            onChange={(e) => setForm({ ...form, service_password: e.target.value })}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={createAccount}
            className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {t('admin.add', language)}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">{t('common.loading', language)}</p>
      ) : visibleAccounts.length === 0 ? (
        <p className="text-gray-500">
          {searchQuery.trim()
            ? t('admin.searchPoolPlaceholder', language)
            : t('admin.noPoolAccounts', language)}
        </p>
      ) : (
        <div className="space-y-4">
          {visibleAccounts.map((acc) => {
            const free = acc.max_slots - acc.slots_used
            const open = expanded === acc.id
            const summary = inUseSummary(acc)
            const rows = usageRows(acc)
            const rentalCount = activeRentalsOnAccount(acc)
            return (
              <div key={acc.id} className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : acc.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-white font-mono text-sm">{acc.service_email}</p>
                    <p className="text-gray-500 text-xs">
                      {acc.product_name || t('admin.noProduct', language)} ·{' '}
                      {acc.slots_used}/{acc.max_slots} {t('admin.used', language)} · {free}{' '}
                      {t('admin.free', language)} · {acc.status}
                    </p>
                    {summary && (
                      <p className="text-amber-400/90 text-xs mt-1">
                        {t('admin.usageSummary', language)}: {summary}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openAccountBan(acc)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-xs font-bold"
                    title={t('admin.poolBanAll', language)}
                  >
                    <Ban size={14} /> {t('admin.poolBanAll', language)}
                  </button>
                  <select
                    value={acc.status}
                    onChange={(e) => patchAccount(acc.id, { status: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                  >
                    <option value="active">active</option>
                    <option value="full">full</option>
                    <option value="disabled">disabled</option>
                  </select>
                  <button
                    onClick={() => saveAccount(acc)}
                    className="p-2 text-green-400 hover:bg-green-500/10 rounded"
                    title={t('admin.save', language)}
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {open && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-xs text-gray-400 md:col-span-2">
                        {t('admin.linkedProduct', language)}
                        <select
                          value={acc.product_id || ''}
                          onChange={(e) => patchAccount(acc.id, { product_id: e.target.value || null })}
                          className="block w-full mt-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="">{t('admin.noProduct', language)}</option>
                          {catalog.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-gray-400">
                        Email
                        <input
                          value={acc.service_email}
                          onChange={(e) => patchAccount(acc.id, { service_email: e.target.value })}
                          className="block w-full mt-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                        />
                      </label>
                      <label className="text-xs text-gray-400">
                        {t('admin.password', language)}
                        <input
                          value={acc.service_password}
                          onChange={(e) => patchAccount(acc.id, { service_password: e.target.value })}
                          className="block w-full mt-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                        />
                      </label>
                      <label className="text-xs text-gray-400">
                        slots_used
                        <input
                          type="number"
                          min={0}
                          max={acc.max_slots}
                          value={acc.slots_used}
                          onChange={(e) =>
                            patchAccount(acc.id, { slots_used: Number(e.target.value) })
                          }
                          className="block w-full mt-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-netflix-red font-semibold">{t('admin.slotsEditor', language)}</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-left">
                          <th className="py-1">#</th>
                          <th>{t('admin.profileName', language)}</th>
                          <th>PIN</th>
                          <th>{t('admin.slotStatus', language)}</th>
                          <th>{t('admin.assignedUser', language)}</th>
                          <th className="w-28" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s, idx) => (
                          <tr key={s.slot_number} className="border-t border-white/5">
                            <td className="py-2 text-gray-400">{s.slot_number}</td>
                            <td>
                              <input
                                value={acc.slot_details?.[idx]?.profile_name ?? s.profile_name}
                                onChange={(e) =>
                                  updateSlot(acc.id, idx, 'profile_name', e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white"
                              />
                            </td>
                            <td>
                              <input
                                value={acc.slot_details?.[idx]?.pin ?? s.pin ?? ''}
                                onChange={(e) => updateSlot(acc.id, idx, 'pin', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white"
                              />
                            </td>
                            <td className="py-2">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  s.in_use
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-green-500/15 text-green-400'
                                }`}
                              >
                                {s.in_use ? t('admin.inUse', language) : t('admin.available', language)}
                              </span>
                            </td>
                            <td className="py-2 text-xs">
                              {s.in_use ? (
                                <div>
                                  <p className="text-white">{s.user_name || '—'}</p>
                                  <p className="text-gray-500">{s.user_email}</p>
                                  {s.product_name && (
                                    <p className="text-gray-600 mt-0.5">
                                      {s.product_name}
                                      {s.expires_at &&
                                        ` · ${formatDate(new Date(s.expires_at))}`}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-600">{t('admin.noAssignment', language)}</span>
                              )}
                            </td>
                            <td className="py-2">
                              {s.in_use && s.rental_id && (
                                <button
                                  type="button"
                                  onClick={() => openSlotBan(acc, s)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/15 text-red-400 rounded text-xs font-bold hover:bg-red-600/25"
                                >
                                  <Ban size={12} /> {t('admin.poolBanSlot', language)}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rentalCount === 0 && acc.status !== 'disabled' && (
                      <p className="text-gray-500 text-xs">{t('admin.poolBanNoRentals', language)}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-dark rounded-2xl border border-white/10 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-2">
              {banTarget.mode === 'account'
                ? t('admin.poolBanTitle', language)
                : t('admin.poolBanSlotTitle', language)}
            </h3>
            <p className="text-gray-400 text-sm mb-1 font-mono">{banTarget.account.service_email}</p>
            <p className="text-gray-500 text-xs mb-4">
              {banTarget.mode === 'account'
                ? t('admin.poolBanDesc', language)
                : `${t('admin.poolBanSlotDesc', language)} — ${banTarget.slotLabel}`}
            </p>
            {banTarget.mode === 'account' && activeRentalsOnAccount(banTarget.account) === 0 && (
              <p className="text-amber-400/90 text-xs mb-3">{t('admin.poolBanNoRentals', language)}</p>
            )}
            <label className="block text-xs text-gray-400 mb-1">{t('admin.banReason', language)}</label>
            <select
              value={banReasonId}
              onChange={(e) => setBanReasonId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white mb-3 max-h-48"
            >
              {groupedReasons.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.reasons.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      [{reason.code}] {language === 'vi' ? reason.title_vi : reason.title_en}
                    </option>
                  ))}
                </optgroup>
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
                disabled={!banReasonId}
                className="flex-1 bg-netflix-red text-white font-bold py-2 rounded-lg disabled:opacity-50"
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
