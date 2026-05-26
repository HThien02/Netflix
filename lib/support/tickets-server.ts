import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import type { SupportAttachmentMeta } from '@/lib/support/attachments'
import type { SupportTicket } from '@/lib/types'

type DbTicket = {
  id: string
  user_id: string
  subject: string
  description: string | null
  status: string
  priority: string
  category: string | null
  attachments: SupportAttachmentMeta[] | null
  admin_response?: string | null
  admin_responded_at?: string | null
  created_at: string
  updated_at: string
}

export function mapDbTicket(row: DbTicket): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject,
    description: row.description || '',
    priority: row.priority as SupportTicket['priority'],
    status: row.status as SupportTicket['status'],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    adminResponse: row.admin_response?.trim() || undefined,
    adminRespondedAt: row.admin_responded_at ? new Date(row.admin_responded_at) : undefined,
    messages: [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export type PurchasedAccountReviewRow = {
  id: string
  product_name: string
  plan_type: string
  expires_at: string
  status: string
  user_rating: number | null
  user_review: string | null
  rated_at: string | null
  created_at: string
}

export function mapPurchasedAccountReview(row: PurchasedAccountReviewRow) {
  return {
    id: row.id,
    productName: row.product_name,
    planType: row.plan_type,
    expiresAt: row.expires_at,
    status: row.status,
    userRating: row.user_rating ?? undefined,
    userReview: row.user_review ?? undefined,
    ratedAt: row.rated_at ?? undefined,
    createdAt: row.created_at,
  }
}

export async function listPurchasedAccountsForReview(userId: string) {
  if (!isSupabaseConfigured()) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('purchased_accounts')
    .select(
      'id, product_name, plan_type, expires_at, status, user_rating, user_review, rated_at, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[support] list purchased accounts failed', error.message)
    return []
  }

  return (data as PurchasedAccountReviewRow[]).map(mapPurchasedAccountReview)
}

export async function listUserSupportTickets(userId: string): Promise<SupportTicket[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[support] list failed', error.message)
    return []
  }

  return (data as DbTicket[]).map(mapDbTicket)
}

export async function createSupportTicket(input: {
  userId: string
  subject: string
  description: string
  attachments: SupportAttachmentMeta[]
  category?: string
}): Promise<SupportTicket> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: input.userId,
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: 'open',
      priority: 'medium',
      category: input.category || 'general',
      attachments: input.attachments,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Could not create ticket')
  }

  return mapDbTicket(data as DbTicket)
}

export async function uploadSupportAttachments(
  userId: string,
  ticketId: string,
  files: File[],
): Promise<SupportAttachmentMeta[]> {
  if (!files.length) return []
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const supabase = createAdminClient()
  const uploaded: SupportAttachmentMeta[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const path = `${userId}/${ticketId}/${safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage.from('support-attachments').upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

    if (error) {
      console.error('[support] upload failed', path, error.message)
      throw new Error('Không tải được ảnh lên. Thử lại hoặc bỏ bớt file.')
    }

    const { data: publicUrl } = supabase.storage.from('support-attachments').getPublicUrl(path)
    uploaded.push({
      url: publicUrl.publicUrl,
      name: file.name,
      mimeType: file.type || 'image/jpeg',
      size: file.size,
    })
  }

  return uploaded
}
