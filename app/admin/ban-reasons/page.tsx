'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AdminShell, adminHeaders } from '@/components/admin/admin-shell'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { Plus, Save, Trash2 } from 'lucide-react'
import { groupBanReasonsByCategory } from '@/lib/ban-reasons/violations-catalog'

type Reason = {
  id: string
  code: string
  title_vi: string
  title_en: string
  description_vi?: string
  description_en?: string
  is_active: boolean
  sort_order: number
}

const empty = {
  code: '',
  title_vi: '',
  title_en: '',
  description_vi: '',
  description_en: '',
  is_active: true,
  sort_order: 0,
}

export default function AdminBanReasonsPage() {
  const { currentUser, language } = useApp()
  const [reasons, setReasons] = useState<Reason[]>([])
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    const res = await fetch('/api/admin/ban-reasons', { headers: adminHeaders(currentUser.id) })
    const data = await res.json()
    if (res.ok) setReasons(data.reasons || [])
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (!currentUser || !form.code) return
    await fetch('/api/admin/ban-reasons', {
      method: 'POST',
      headers: adminHeaders(currentUser.id),
      body: JSON.stringify({ adminUserId: currentUser.id, ...form }),
    })
    setForm(empty)
    load()
  }

  const save = async (r: Reason) => {
    if (!currentUser) return
    await fetch(`/api/admin/ban-reasons/${r.id}`, {
      method: 'PATCH',
      headers: adminHeaders(currentUser.id),
      body: JSON.stringify({ adminUserId: currentUser.id, ...r }),
    })
    load()
  }

  const remove = async (id: string) => {
    if (!currentUser || !confirm(t('admin.confirmDelete', language))) return
    await fetch(`/api/admin/ban-reasons/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(currentUser.id),
    })
    load()
  }

  const patch = (id: string, field: keyof Reason, value: string | number | boolean) => {
    setReasons((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold text-white mb-2">{t('admin.banReasons', language)}</h1>
      <p className="text-gray-400 mb-2">{t('admin.banReasonsDesc', language)}</p>
      <p className="text-gray-500 text-xs mb-6">{t('admin.banReasonsCatalogHint', language)}</p>

      <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">{t('admin.addReason', language)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            placeholder="code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
          <input
            placeholder={t('admin.titleVi', language)}
            value={form.title_vi}
            onChange={(e) => setForm({ ...form, title_vi: e.target.value })}
            className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
          <input
            placeholder={t('admin.titleEn', language)}
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
            className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <button
          onClick={create}
          className="bg-netflix-red text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16} /> {t('admin.add', language)}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">{t('common.loading', language)}</p>
      ) : (
        <div className="space-y-8">
          {groupBanReasonsByCategory(reasons, language).map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-semibold text-netflix-red mb-3">{group.label}</h2>
              <div className="space-y-3">
                {group.reasons.map((r) => (
            <div key={r.id} className="glass-dark rounded-xl p-4 border border-white/10 grid gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  value={r.code}
                  onChange={(e) => patch(r.id, 'code', e.target.value)}
                  className="w-32 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs font-mono"
                />
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={r.is_active}
                    onChange={(e) => patch(r.id, 'is_active', e.target.checked)}
                  />
                  active
                </label>
                <button onClick={() => save(r)} className="ml-auto text-green-400 p-1">
                  <Save size={18} />
                </button>
                <button onClick={() => remove(r.id)} className="text-red-400 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
              <input
                value={r.title_vi}
                onChange={(e) => patch(r.id, 'title_vi', e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
              />
              <input
                value={r.title_en}
                onChange={(e) => patch(r.id, 'title_en', e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
              />
              <textarea
                value={r.description_vi || ''}
                onChange={(e) => patch(r.id, 'description_vi', e.target.value)}
                rows={2}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs"
                placeholder="VI desc"
              />
              <textarea
                value={r.description_en || ''}
                onChange={(e) => patch(r.id, 'description_en', e.target.value)}
                rows={2}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs"
                placeholder="EN desc"
              />
            </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
