'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { formatDate } from '@/lib/utils/format'
import type { SupportTicket } from '@/lib/types'
import { supportPriorityLabel, supportStatusLabel } from '@/lib/support/status-labels'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Plus, Search, X, Loader2 } from 'lucide-react'

export default function SupportTicketsPage() {
  const { language } = useApp()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all')
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/support/tickets', { credentials: 'same-origin' })
        const data = await res.json()
        if (!cancelled && res.ok && Array.isArray(data.tickets)) {
          setTickets(
            data.tickets.map((ticket: SupportTicket) => ({
              ...ticket,
              createdAt: new Date(ticket.createdAt),
              updatedAt: new Date(ticket.updatedAt),
            })),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter, tickets])

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    }
  }

  const selectedTicketData = tickets.find((t) => t.id === selectedTicket)

  const statusFilters: Array<{ id: typeof statusFilter; labelKey: string }> = [
    { id: 'all', labelKey: 'support.statusAll' },
    { id: 'open', labelKey: 'support.statusOpen' },
    { id: 'in_progress', labelKey: 'support.statusInProgress' },
    { id: 'resolved', labelKey: 'support.statusResolved' },
    { id: 'closed', labelKey: 'support.statusClosed' },
  ]

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <h1 className="text-4xl font-bold text-white">{t('support.title', language)}</h1>
              <Link
                href="/support/new"
                className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all"
              >
                <Plus size={20} />
                {t('support.newTicket', language)}
              </Link>
            </div>
            <p className="text-gray-400">{t('support.subtitle', language)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('support.search', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {statusFilters.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                    statusFilter === id
                      ? 'bg-netflix-red text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {t(labelKey, language)}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin text-netflix-red" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {filteredTickets.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedTicket(ticket.id)}
                        className={`glass-dark rounded-2xl p-6 border cursor-pointer transition-all ${
                          selectedTicket === ticket.id
                            ? 'border-netflix-red bg-netflix-red/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4 gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-lg mb-1 truncate">
                              {ticket.subject}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${getStatusColor(ticket.status)}`}
                          >
                            {supportStatusLabel(ticket.status, language)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="font-mono text-xs">#{ticket.id.slice(0, 8)}</span>
                          <span>{formatDate(ticket.createdAt, language)}</span>
                          {(ticket.attachments?.length ?? 0) > 0 && (
                            <span>
                              {ticket.attachments!.length}{' '}
                              {language === 'vi' ? 'ảnh' : 'image(s)'}
                            </span>
                          )}
                          <span>
                            {t('support.priority', language)}:{' '}
                            <span className="text-white">
                              {supportPriorityLabel(ticket.priority, language)}
                            </span>
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-gray-400 mb-4">{t('support.noTickets', language)}</p>
                    <Link
                      href="/support/new"
                      className="inline-block bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      {t('support.createFirst', language)}
                    </Link>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {selectedTicketData ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-dark rounded-2xl p-6 border border-white/10 h-fit sticky top-20"
                  >
                    <div className="flex items-start justify-between mb-6 gap-2">
                      <h2 className="text-xl font-bold text-white flex-1">{selectedTicketData.subject}</h2>
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(null)}
                        className="text-gray-400 hover:text-white shrink-0"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-4 mb-6 pb-6 border-b border-white/10 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                          {t('support.ticketId', language)}
                        </p>
                        <p className="text-white font-mono text-xs break-all">{selectedTicketData.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                          {t('support.status', language)}
                        </p>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit ${getStatusColor(selectedTicketData.status)}`}
                        >
                          {supportStatusLabel(selectedTicketData.status, language)}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                          {t('support.created', language)}
                        </p>
                        <p className="text-white">{formatDate(selectedTicketData.createdAt, language)}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                        {t('support.description', language)}
                      </p>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">
                        {selectedTicketData.description}
                      </p>
                    </div>

                    {(selectedTicketData.attachments?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                          {t('support.attachedImages', language)}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedTicketData.attachments!.map((att) => (
                            <a
                              key={att.url}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-netflix-red"
                            >
                              <Image
                                src={att.url}
                                alt={att.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-dark rounded-2xl p-6 border border-white/10 h-fit sticky top-20 text-center text-gray-400 hidden lg:block"
                  >
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{t('support.selectTicket', language)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  )
}
