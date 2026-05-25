import { Suspense } from 'react'
import { PayosReturnClient } from './payos-return-client'

export default function PayosReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
          ...
        </div>
      }
    >
      <PayosReturnClient />
    </Suspense>
  )
}
