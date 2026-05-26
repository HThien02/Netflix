import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session-server'

/** Chỉ user đã đăng nhập mới vào /support/* */
export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) {
    redirect('/auth/login?next=/support/tickets')
  }
  return children
}
