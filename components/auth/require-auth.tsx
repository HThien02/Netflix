'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { Loader2 } from 'lucide-react'

type Props = {
  children: React.ReactNode
  /** Chỉ admin */
  admin?: boolean
  /** Chỉ customer/merchant (không phải guest) */
  loginRequired?: boolean
}

export function RequireAuth({ children, admin = false, loginRequired = true }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { authReady, isAuthenticated, currentUser, language } = useApp()

  useEffect(() => {
    if (!authReady) return

    if (loginRequired && !isAuthenticated) {
      const next = encodeURIComponent(pathname || '/')
      router.replace(`/auth/login?next=${next}`)
      return
    }

    if (admin && currentUser?.role !== 'admin') {
      router.replace('/')
    }
  }, [authReady, isAuthenticated, currentUser, admin, loginRequired, pathname, router])

  if (!authReady) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin text-netflix-red mr-2" size={24} />
        {t('common.loading', language)}
      </div>
    )
  }

  if (loginRequired && !isAuthenticated) {
    return null
  }

  if (admin && currentUser?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <p className="text-gray-300">{t('admin.accessDenied', language)}</p>
      </div>
    )
  }

  return <>{children}</>
}
