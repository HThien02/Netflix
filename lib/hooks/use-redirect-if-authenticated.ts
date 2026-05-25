'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'

/** Đã đăng nhập → chuyển về trang chủ (không cho vào login/signup). */
export function useRedirectIfAuthenticated(redirectTo = '/') {
  const router = useRouter()
  const { isAuthenticated, authReady } = useApp()

  useEffect(() => {
    if (authReady && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [authReady, isAuthenticated, router, redirectTo])

  const shouldShowAuthForm = authReady && !isAuthenticated

  return { authReady, isAuthenticated, shouldShowAuthForm }
}
