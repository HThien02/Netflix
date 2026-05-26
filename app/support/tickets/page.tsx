import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session-server'
import {
  listPurchasedAccountsForReview,
  listUserSupportTickets,
} from '@/lib/support/tickets-server'
import {
  SupportTicketsClient,
  type PurchasedAccountReview,
  type SerializedTicket,
} from './support-tickets-client'

export default async function SupportTicketsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/auth/login?next=/support/tickets')
  }

  const [tickets, accounts] = await Promise.all([
    listUserSupportTickets(session.userId),
    listPurchasedAccountsForReview(session.userId),
  ])

  const initialTickets: SerializedTicket[] = tickets.map((ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    adminRespondedAt: ticket.adminRespondedAt?.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString(),
  }))

  const initialAccounts: PurchasedAccountReview[] = accounts

  return (
    <SupportTicketsClient initialTickets={initialTickets} initialAccounts={initialAccounts} />
  )
}
