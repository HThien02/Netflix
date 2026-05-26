'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { shouldForwardOAuthQueryToCallback } from '@/lib/auth/oauth-query'

export function OAuthCodeRedirect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname === '/auth/callback') return
    if (!shouldForwardOAuthQueryToCallback(pathname, searchParams)) return

    const url = new URL('/auth/callback', window.location.origin)
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
    window.location.replace(url.toString())
  }, [pathname, searchParams])

  return null
}
