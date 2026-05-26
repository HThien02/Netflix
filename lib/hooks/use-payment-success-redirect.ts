'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_SECONDS = 3
const TARGET = '/my-accounts'

/** Sau thanh toán thành công: đếm ngược rồi chuyển tới trang tài khoản đã mua. */
export function usePaymentSuccessRedirect(active: boolean, seconds = DEFAULT_SECONDS) {
  const router = useRouter()
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (!active) return

    setRemaining(seconds)
    const interval = setInterval(() => {
      setRemaining((n) => (n <= 1 ? 0 : n - 1))
    }, 1000)

    const timeout = setTimeout(() => {
      router.replace(TARGET)
    }, seconds * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [active, router, seconds])

  return { remaining, target: TARGET }
}
