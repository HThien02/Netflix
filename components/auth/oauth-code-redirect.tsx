'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/** Dự phòng: ?code= trên trang khác /auth/callback → chuyển đúng route (middleware đã xử lý phần lớn). */
export function OAuthCodeRedirect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname === '/auth/callback') return
    const code = searchParams.get('code')
    const err = searchParams.get('error')
    if (!code && !err) return

    const url = new URL('/auth/callback', window.location.origin)
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
    window.location.replace(url.toString())
  }, [pathname, searchParams])

  return null
}
