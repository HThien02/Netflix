import { NextResponse } from 'next/server'
import {
  createSupportTicket,
  listUserSupportTickets,
  uploadSupportAttachments,
} from '@/lib/support/tickets-server'
import { validateSupportImageFiles } from '@/lib/support/attachments'
import { getSessionOrNull, guardApiRequest } from '@/lib/security/request-guard'
import { createSupportTicketSchema } from '@/lib/validation/support'

export async function GET(request: Request) {
  const denied = await guardApiRequest(request, { auth: 'session', skipRateLimit: true })
  if (denied) return denied

  const session = getSessionOrNull(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tickets = await listUserSupportTickets(session.userId)
  return NextResponse.json({ tickets })
}

export async function POST(request: Request) {
  const denied = await guardApiRequest(request, { auth: 'session', skipRateLimit: true })
  if (denied) return denied

  const session = getSessionOrNull(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const subject = String(formData.get('subject') || '')
    const description = String(formData.get('description') || '')
    const category = formData.get('category') ? String(formData.get('category')) : undefined

    const parsed = createSupportTicketSchema.safeParse({ subject, description, category })
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 },
      )
    }

    const files = formData
      .getAll('images')
      .filter((f): f is File => f instanceof File && f.size > 0)

    const fileError = validateSupportImageFiles(files)
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 })
    }

    const ticket = await createSupportTicket({
      userId: session.userId,
      subject: parsed.data.subject,
      description: parsed.data.description,
      attachments: [],
      category: parsed.data.category,
    })

    let attachments = ticket.attachments || []
    if (files.length > 0) {
      attachments = await uploadSupportAttachments(session.userId, ticket.id, files)
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      await supabase
        .from('support_tickets')
        .update({ attachments })
        .eq('id', ticket.id)
        .eq('user_id', session.userId)
    }

    return NextResponse.json({
      ticket: { ...ticket, attachments },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create ticket' },
      { status: 500 },
    )
  }
}
