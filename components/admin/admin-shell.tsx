'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { Database, Ban, ShieldAlert, LayoutDashboard, Package, Landmark } from 'lucide-react'

const links = [
  { href: '/admin/dashboard', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { href: '/admin/products', labelKey: 'admin.productsManage', icon: Package },
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

export function adminHeaders(userId: string) {
  return { 'Content-Type': 'application/json', 'x-admin-user-id': userId }
}
