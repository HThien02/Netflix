'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { UserDataGate } from '@/components/user-data-gate'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import {
  formatCurrency,
  formatDate,
  formatProfileName,
  formatSlotAssignmentLine,
} from '@/lib/utils/format'
import { invoiceStatusLabel } from '@/lib/invoices/display'
import { motion } from 'framer-motion'
import {
  KeyRound,
  Receipt,
  Copy,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import type { PurchasedAccount } from '@/lib/types'
import { planLabel } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'
import { UserSepayStats } from '@/components/sepay/user-sepay-stats'

function daysLeft(expiresAt: Date) {
  return Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

function AccountCard({
  account,
  language,
}: {
  account: PurchasedAccount
  language: 'vi' | 'en'
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const revoked = account.status === 'revoked'
  const active = !revoked && account.status === 'active' && account.expiresAt > new Date()
  const remaining = daysLeft(account.expiresAt)

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <motion.div
      layout
      className={`glass-dark rounded-2xl p-6 border ${
        active ? 'border-green-500/40' : 'border-white/10 opacity-75'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{account.productName}</h3>
          <p className="text-gray-400 text-sm capitalize">
            {planLabel(account.planType as PlanType, language)}
            {account.profileName
              ? ` · ${formatProfileName(account.profileName, language)}`
              : ''}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
            active
              ? 'bg-green-500/20 text-green-400 border-green-500/40'
              : 'bg-gray-500/20 text-gray-400 border-gray-500/40'
          }`}
        >
          {active ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {revoked
            ? t('myAccounts.revoked', language)
            : active
              ? language === 'vi'
                ? `Còn ${remaining} ${t('myAccounts.daysLeft', language)}`
                : `${remaining} ${t('myAccounts.daysLeft', language)}`
              : t('myAccounts.expired', language)}
        </span>
      </div>

      {active ? (
        <div className="space-y-3 bg-black/30 rounded-xl p-4 border border-white/5">
          <CredentialRow
            label={t('myAccounts.loginEmail', language)}
            value={account.serviceEmail}
            copied={copied}
            field="email"
            onCopy={copy}
            language={language}
          />
          <CredentialRow
            label={t('myAccounts.password', language)}
            value={account.servicePassword}
            copied={copied}
            field="password"
            onCopy={copy}
            masked={!showPassword}
            onToggleMask={() => setShowPassword(!showPassword)}
            language={language}
          />
          {account.slotsCount && account.slotsCount > 0 && (
            <p className="text-gray-400 text-xs">
              {account.slotsCount} {t('marketplace.slots', language)}
            </p>
          )}
          {account.slotAssignments && account.slotAssignments.length > 0 && (
            <ul className="text-xs text-gray-400 space-y-1 pt-2 border-t border-white/10">
              {account.slotAssignments.map((s) => (
                <li key={s.slot_number}>{formatSlotAssignmentLine(s, language)}</li>
              ))}
            </ul>
          )}
          {account.extraNotes && (
            <p className="text-gray-500 text-xs pt-2 border-t border-white/10">{account.extraNotes}</p>
          )}
          <p className="text-gray-500 text-xs">
            {t('myAccounts.expires', language)}:{' '}
            <span className="text-gray-300">{formatDate(account.expiresAt, language)}</span>
          </p>
        </div>
      ) : revoked ? (
        <p className="text-red-400/90 text-sm">{t('myAccounts.revoked', language)}</p>
      ) : (
        <p className="text-gray-500 text-sm">
          {t('myAccounts.expiredHint', language)}
        </p>
      )}
    </motion.div>
  )
}

function CredentialRow({
  label,
  value,
  copied,
  field,
  onCopy,
  masked,
  onToggleMask,
  language,
}: {
  label: string
  value: string
  copied: string | null
  field: string
  onCopy: (field: string, value: string) => void
  masked?: boolean
  onToggleMask?: () => void
  language: 'vi' | 'en'
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="text-gray-500 text-xs w-28 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <code className="flex-1 text-white text-sm font-mono truncate bg-black/40 px-3 py-2 rounded-lg">
          {masked ? '••••••••••••' : value}
        </code>
        {onToggleMask && (
          <button
            type="button"
            onClick={onToggleMask}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Toggle password"
          >
            {masked ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
        <button
          type="button"
          onClick={() => onCopy(field, value)}
          className="p-2 text-gray-400 hover:text-netflix-red"
          aria-label="Copy"
        >
          <Copy size={18} />
        </button>
        {copied === field && (
          <span className="text-green-400 text-xs">{t('myAccounts.copied', language)}</span>
        )}
      </div>
    </div>
  )
}

export default function MyAccountsPage() {
  const { currentUser, isAuthenticated, language, userInvoices, purchasedAccounts } = useApp()
  const [tab, setTab] = useState<'accounts' | 'history'>('accounts')

  const activeAccounts = useMemo(
    () =>
      purchasedAccounts.filter(
        (a) => a.status === 'active' && a.expiresAt > new Date(),
      ),
    [purchasedAccounts],
  )

  const expiredAccounts = useMemo(
    () =>
      purchasedAccounts.filter(
        (a) => a.status !== 'active' || a.expiresAt <= new Date(),
      ),
    [purchasedAccounts],
  )

  if (!isAuthenticated || !currentUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">{t('myAccounts.signInRequired', language)}</p>
          <Link href="/auth/login" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            {t('nav.signIn', language)}
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <UserDataGate>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{t('myAccounts.title', language)}</h1>
            <p className="text-gray-400">{t('myAccounts.subtitle', language)}</p>
          </motion.div>

          <div className="flex gap-2 mb-8">
            <button
              type="button"
              onClick={() => setTab('accounts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'accounts' ? 'bg-netflix-red text-white' : 'bg-white/10 text-gray-300'
              }`}
            >
              <KeyRound size={18} />
              {t('myAccounts.tabAccounts', language)}
              {activeAccounts.length > 0 && (
                <span className="bg-white/20 px-1.5 rounded text-xs">{activeAccounts.length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'history' ? 'bg-netflix-red text-white' : 'bg-white/10 text-gray-300'
              }`}
            >
              <Receipt size={18} />
              {t('myAccounts.tabHistory', language)}
            </button>
          </div>

          {tab === 'accounts' && (
            <div className="space-y-8">
              {activeAccounts.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="text-green-400" size={20} />
                    {t('myAccounts.activeTitle', language)}
                  </h2>
                  {activeAccounts.map((account) => (
                    <AccountCard key={account.id} account={account} language={language} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 glass-dark rounded-2xl border border-white/10">
                  <KeyRound className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-white font-medium mb-2">{t('myAccounts.noActive', language)}</p>
                  <p className="text-gray-500 text-sm mb-6">{t('myAccounts.noActiveHint', language)}</p>
                  <Link
                    href="/marketplace"
                    className="inline-block bg-netflix-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg"
                  >
                    {t('myAccounts.browse', language)}
                  </Link>
                </div>
              )}

              {expiredAccounts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-400">
                    {t('myAccounts.expiredTitle', language)}
                  </h2>
                  {expiredAccounts.map((account) => (
                    <AccountCard key={account.id} account={account} language={language} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              <UserSepayStats />
              {userInvoices.length > 0 ? (
                userInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="glass-dark rounded-xl p-5 border border-white/10 flex flex-wrap justify-between gap-4"
                  >
                    <div>
                      <p className="text-white font-mono text-sm">
                        {inv.invoiceNumber || inv.id.slice(0, 8)}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatDate(inv.invoiceDate, language)}
                      </p>
                      {inv.items?.map((item, i) => (
                        <p key={i} className="text-gray-400 text-sm mt-1">
                          {item.productName} ·{' '}
                          {planLabel(item.planType as PlanType, language)}
                        </p>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatCurrency(inv.totalAmount)}</p>
                      <p
                        className={`text-sm ${
                          inv.status === 'paid' ? 'text-green-400' : 'text-yellow-400'
                        }`}
                      >
                        {invoiceStatusLabel(inv.status, language)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 glass-dark rounded-2xl border border-white/10">
                  <Receipt className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">{t('myAccounts.noHistory', language)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      </UserDataGate>
    </AppLayout>
  )
}
