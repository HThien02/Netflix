'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { mockSupportTickets } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils/format'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Plus, Search, X } from 'lucide-react'

export default function SupportTicketsPage() {
  const { currentUser, isAuthenticated } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">Please sign in to view support tickets</p>
          <Link href="/auth/login" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Sign In
          </Link>
        </div>
      </AppLayout>
    )
  }

  const filteredTickets = useMemo(() => {
    return mockSupportTickets.filter(ticket => {
      const matchesSearch = 
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      return matchesSearch && matchesStatus && ticket.userId === currentUser?.id
    })
  }, [searchQuery, statusFilter, currentUser])

  const getStatusColor = (status: string) => {
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

  const selectedTicketData = mockSupportTickets.find(t => t.id === selectedTicket)

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold text-white">Support Tickets</h1>
              <Link
                href="/support/new"
                className="bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all"
              >
                <Plus size={20} />
                New Ticket
              </Link>
            </div>
            <p className="text-gray-400">Manage your support requests</p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-netflix-red transition-colors"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                    statusFilter === status
                      ? 'bg-netflix-red text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {status === 'all' && 'All Tickets'}
                  {status === 'open' && 'Open'}
                  {status === 'in_progress' && 'In Progress'}
                  {status === 'resolved' && 'Resolved'}
                  {status === 'closed' && 'Closed'}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tickets List */}
            <div className="lg:col-span-2">
              {filteredTickets.length > 0 ? (
                <div className="space-y-4">
                  {filteredTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedTicket(ticket.id)}
                      className={`glass-dark rounded-2xl p-6 border cursor-pointer transition-all ${
                        selectedTicket === ticket.id
                          ? 'border-netflix-red bg-netflix-red/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg mb-1">{ticket.subject}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-400">
                          <span>#{ticket.id}</span>
                          <span>{formatDate(ticket.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={16} />
                            {ticket.messages.length} messages
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          Priority: <span className="text-white font-semibold capitalize">{ticket.priority}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <p className="text-gray-400 mb-4">No tickets found</p>
                  <Link
                    href="/support/new"
                    className="inline-block bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
                  >
                    Create New Ticket
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Ticket Details Panel */}
            <AnimatePresence>
              {selectedTicketData ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass-dark rounded-2xl p-6 border border-white/10 h-fit sticky top-20"
                >
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex-1">{selectedTicketData.subject}</h2>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Ticket Info */}
                  <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ticket ID</p>
                      <p className="text-white font-mono text-sm">{selectedTicketData.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</p>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit ${getStatusColor(selectedTicketData.status)}`}>
                        {selectedTicketData.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Priority</p>
                      <p className="text-white font-semibold capitalize">{selectedTicketData.priority}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Created</p>
                      <p className="text-white">{formatDate(selectedTicketData.createdAt)}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Description</p>
                    <p className="text-gray-300 text-sm">{selectedTicketData.description}</p>
                  </div>

                  {/* Messages */}
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Messages ({selectedTicketData.messages.length})</p>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {selectedTicketData.messages.map((message, index) => (
                        <div key={index} className="bg-black/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white text-xs font-semibold">{message.senderName}</p>
                            <p className="text-gray-500 text-xs">{formatDate(new Date(message.timestamp))}</p>
                          </div>
                          <p className="text-gray-300 text-xs">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Form */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <textarea
                      placeholder="Type your reply..."
                      className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors text-sm resize-none"
                      rows={3}
                    />
                    <button className="w-full mt-3 bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all">
                      Send Reply
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-dark rounded-2xl p-6 border border-white/10 h-fit sticky top-20 text-center text-gray-400"
                >
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a ticket to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
