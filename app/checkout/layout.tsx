import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session-server'

/** Bảo vệ /checkout/* — cần đăng nhập */
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) {
    redirect('/auth/login?next=/checkout')
  }
  return children
}
