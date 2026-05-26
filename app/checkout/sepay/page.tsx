import { Suspense } from 'react'
import { SepayCheckoutClient } from './sepay-checkout-client'

export default function SepayCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
          ...
        </div>
      }
    >
      <SepayCheckoutClient />
    </Suspense>
  )
}
