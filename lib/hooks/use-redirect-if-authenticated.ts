'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/lib/context'

function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

/** Đã đăng nhập → chuyển về trang chủ (trừ ?switch=1 để đổi tài khoản). */
export function useRedirectIfAuthenticated(redirectTo = '/') {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, authReady } = useApp()

  const switchAccount = searchParams.get('switch') === '1'
  const nextAfterLogin = safeNextPath(searchParams.get('next'), redirectTo)

  useEffect(() => {
    if (authReady && isAuthenticated && !switchAccount) {
      router.replace(nextAfterLogin)
    }
  }, [authReady, isAuthenticated, router, nextAfterLogin, switchAccount])

  const shouldShowAuthForm = authReady && (!isAuthenticated || switchAccount)

  return { authReady, isAuthenticated, shouldShowAuthForm, nextAfterLogin, switchAccount }
}
