'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import {
  Database,
  Ban,
  ShieldAlert,
  LayoutDashboard,
  Package,
  Landmark,
  MessageSquare,
} from 'lucide-react'

const links = [
  { href: '/admin/dashboard', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { href: '/admin/products', labelKey: 'admin.productsManage', icon: Package },
  { href: '/admin/support', labelKey: 'admin.support', icon: MessageSquare },
  { href: '/admin/sepay', labelKey: 'admin.sepay', icon: Landmark },
  { href: '/admin/pool', labelKey: 'admin.pool', icon: Database },
  { href: '/admin/rentals', labelKey: 'admin.rentals', icon: Ban },
  { href: '/admin/ban-reasons', labelKey: 'admin.banReasons', icon: ShieldAlert },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { currentUser, language } = useApp()
  const pathname = usePathname()

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center text-white">
          {t('admin.accessDenied', language)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="bg-netflix-black min-h-screen">
        <div className="border-b border-white/10 bg-netflix-dark/80">
          <div className="container mx-auto px-4 py-4 flex flex-wrap gap-2">
            {links.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-netflix-red text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {t(labelKey, language)}
              </Link>
            ))}
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">{children}</div>
      </div>
    </AppLayout>
  )
}

/** Chỉ auth header — dùng với FormData (browser tự set multipart boundary) */
export function adminAuthHeaders(userId: string): HeadersInit {
  return { 'x-admin-user-id': userId }
}

/** JSON API (POST/PATCH body là application/json) */
export function adminHeaders(userId: string): HeadersInit {
  return { ...adminAuthHeaders(userId), 'Content-Type': 'application/json' }
}

/** Fetch admin API kèm session cookie (bắt buộc trên production) */
export function adminFetch(url: string, userId: string, init?: RequestInit) {
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData
  const base = isFormData ? adminAuthHeaders(userId) : adminHeaders(userId)
  return fetch(url, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...base,
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
}
