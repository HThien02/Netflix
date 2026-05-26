import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session-server'

/** Bảo vệ /admin/* trên server (Node) */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session || session.role !== 'admin') {
    redirect('/auth/login?next=/admin/dashboard')
  }
  return children
}
