'use client'

import { Loader2 } from 'lucide-react'
import { useApp } from '@/lib/context'

/** Chặn hiển thị dữ liệu local/ảo trước khi load xong từ DB */
export function UserDataGate({ children }: { children: React.ReactNode }) {
  const { authReady, isAuthenticated, userDataReady } = useApp()

  if (!authReady || (isAuthenticated && !userDataReady)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
        <Loader2 className="animate-spin text-netflix-red" size={40} />
      </div>
    )
  }

  return <>{children}</>
}
