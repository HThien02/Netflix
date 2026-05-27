import { Suspense } from 'react'
import Image from 'next/image'
import { t } from '@/lib/translations'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

type Props = { params: Promise<{ token: string }> }

export default async function ResetPasswordTokenPage({ params }: Props) {
  const { token } = await params

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image src="/images/login-bg.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Suspense fallback={<div className="text-white">{t('common.loading', 'vi')}</div>}>
          <ResetPasswordForm token={token} />
        </Suspense>
      </div>
    </div>
  )
}
