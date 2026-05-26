import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session-server'

export default async function MyAccountsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) {
    redirect('/auth/login?next=/my-accounts')
  }
  return children
}
