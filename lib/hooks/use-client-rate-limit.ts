'use client'

import { useCallback, useRef } from 'react'

/** Chặn spam nút trên UI (checkout, đăng nhập). */
export function useClientRateLimit(minIntervalMs = 2000) {
  const lastRun = useRef(0)

  const canRun = useCallback(() => {
    const now = Date.now()
    if (now - lastRun.current < minIntervalMs) return false
    lastRun.current = now
    return true
  }, [minIntervalMs])

  return { canRun }
}
