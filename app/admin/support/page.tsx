'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AdminShell, adminFetch } from '@/components/admin/admin-shell'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatDateTime } from '@/lib/utils/format'
import type { SupportTicket } from '@/lib/types'
import { supportPriorityLabel, supportStatusLabel } from '@/lib/support/status-labels'
import { Loader2, MessageSquare, Send } from 'lucide-react'

type TicketStats = {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
}

export default function AdminSupportPage() {
  const { currentUser, language } = useApp()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [reply, setReply] = useState('')
  const [replyStatus, setReplyStatus] = useState<SupportTicket['status']>('in_progress')
  const [replyPriority, setReplyPriority] = useState<SupportTicket['priority']>('medium')

  const load = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError('')
    try {
      const q = statusFilter === 'all' ? '' : `?status=${statusFilter}`
      const res = await adminFetch(`/api/admin/support/tickets${q}`, currentUser.id)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      const list: SupportTicket[] = (data.tickets || []).map((ticket: SupportTicket) => ({
        ...ticket,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
        adminRespondedAt: ticket.adminRespondedAt
          ? new Date(ticket.adminRespondedAt)
          : undefined,
      }))
      setTickets(list)
      setStats(data.stats || null)
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [currentUser, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const selected = tickets.find((tk) => tk.id === selectedId) ?? null

  useEffect(() => {
    if (selected) {
      setReply(selected.adminResponse || '')
      setReplyStatus(
        selected.status === 'open' ? 'in_progress' : selected.status,
      )
      setReplyPriority(selected.priority)
    }
  }, [selected?.id])

  const submitReply = async () => {
    if (!currentUser || !selected) return
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const res = await adminFetch(`/api/admin/support/tickets/${selected.id}`, currentUser.id, {
        method: 'PATCH',
        body: JSON.stringify({
          adminResponse: reply,
          status: replyStatus,
          priority: replyPriority,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setMsg(t('admin.supportSaved', language))
      await load()
      if (data.ticket?.id) setSelectedId(data.ticket.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const statusFilters: Array<{ id: typeof statusFilter; labelKey: string }> = [
    { id: 'all', labelKey: 'support.statusAll' },
    { id: 'open', labelKey: 'support.statusOpen' },
    { id: 'in_progress', labelKey: 'support.statusInProgress' },
    { id: 'resolved', labelKey: 'support.statusResolved' },
    { id: 'closed', labelKey: 'support.statusClosed' },
  ]

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('admin.supportTitle', language)}</h1>
        <p className="text-gray-400 text-sm mt-1">{t('admin.supportDesc', language)}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: t('admin.supportStatTotal', language), value: stats.total },
            { label: t('support.statusOpen', language), value: stats.open },
            { label: t('support.statusInProgress', language), value: stats.inProgress },
            { label: t('support.statusResolved', language), value: stats.resolved },
            { label: t('support.statusClosed', language), value: stats.closed },
          ].map((s) => (
            <div key={s.label} className="glass-dark rounded-xl p-4 border border-white/10">
              <p className="text-gray-500 text-xs">{s.label}</p>
              <p className="text-white text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {statusFilters.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setStatusFilter(id)
              setSelectedId(null)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              statusFilter === id
                ? 'bg-netflix-red text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {t(labelKey, language)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-netflix-red" size={36} />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 mb-4">
          {error}
        </div>
      )}

      {msg && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400 mb-4">
          {msg}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <p className="text-gray-500 text-center py-12">{t('admin.supportEmpty', language)}</p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full text-left glass-dark rounded-xl p-4 border transition-all ${
                    selectedId === ticket.id
                      ? 'border-netflix-red bg-netflix-red/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between gap-2 mb-2">
                    <h3 className="text-white font-semibold truncate">{ticket.subject}</h3>
                    <span className="text-xs text-gray-400 shrink-0">
                      {supportStatusLabel(ticket.status, language)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mb-1">
                    {ticket.userName || ticket.userEmail || ticket.userId.slice(0, 8)}
                  </p>
                  <p className="text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                  <p className="text-gray-600 text-xs mt-2">
                    {formatDateTime(ticket.createdAt, language)}
                  </p>
                </button>
              ))
            )}
          </div>

          {selected ? (
            <div className="glass-dark rounded-2xl p-6 border border-white/10 h-fit lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-white mb-4">{selected.subject}</h2>
              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-white/10">
                <p className="text-gray-400">
                  {t('admin.supportCustomer', language)}:{' '}
                  <span className="text-white">
                    {selected.userName || '—'} ({selected.userEmail || selected.userId})
                  </span>
                </p>
                <p className="text-gray-400">
                  {t('support.createdAt', language)}:{' '}
                  <span className="text-white">{formatDateTime(selected.createdAt, language)}</span>
                </p>
                <p className="text-gray-400">
                  {t('support.priority', language)}:{' '}
                  <span className="text-white">
                    {supportPriorityLabel(selected.priority, language)}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                  {t('support.yourMessage', language)}
                </p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap bg-black/30 p-4 rounded-lg">
                  {selected.description}
                </p>
              </div>

              {(selected.attachments?.length ?? 0) > 0 && (
                <div className="mb-6 grid grid-cols-3 gap-2">
                  {selected.attachments!.map((att) => (
                    <a
                      key={att.url}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-lg overflow-hidden border border-white/10"
                    >
                      <Image src={att.url} alt={att.name} fill className="object-cover" unoptimized />
                    </a>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">
                    {t('admin.supportReply', language)}
                  </label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={5}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-netflix-red"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">
                      {t('support.status', language)}
                    </label>
                    <select
                      value={replyStatus}
                      onChange={(e) =>
                        setReplyStatus(e.target.value as SupportTicket['status'])
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="open">{t('support.statusOpen', language)}</option>
                      <option value="in_progress">
                        {t('support.statusInProgress', language)}
                      </option>
                      <option value="resolved">{t('support.statusResolved', language)}</option>
                      <option value="closed">{t('support.statusClosed', language)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">
                      {t('support.priority', language)}
                    </label>
                    <select
                      value={replyPriority}
                      onChange={(e) =>
                        setReplyPriority(e.target.value as SupportTicket['priority'])
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                {selected.adminRespondedAt && (
                  <p className="text-gray-500 text-xs">
                    {t('support.repliedAt', language)}:{' '}
                    {formatDateTime(selected.adminRespondedAt, language)}
                  </p>
                )}
                <button
                  type="button"
                  disabled={saving || !reply.trim()}
                  onClick={() => void submitReply()}
                  className="inline-flex items-center gap-2 bg-netflix-red hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {t('admin.supportSendReply', language)}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-8 border border-white/10 text-center text-gray-500">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
              <p>{t('admin.supportSelect', language)}</p>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  )
}
