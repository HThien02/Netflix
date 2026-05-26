import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { getSessionOrNull, guardApiRequest } from '@/lib/security/request-guard'
import { packageReviewSchema } from '@/lib/validation/review'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const denied = await guardApiRequest(request, { auth: 'session', skipRateLimit: true })
  if (denied) return denied

  const session = getSessionOrNull(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const { id } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = packageReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const { data: existing, error: fetchErr } = await supabase
    .from('purchased_accounts')
    .select('id, user_id, user_rating')
    .eq('id', id)
    .eq('user_id', session.userId)
    .maybeSingle()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Không tìm thấy gói đã mua' }, { status: 404 })
  }

  if (existing.user_rating != null) {
    return NextResponse.json({ error: 'Bạn đã đánh giá gói này rồi' }, { status: 409 })
  }

  const reviewText = parsed.data.review?.trim() || null
  const { data, error } = await supabase
    .from('purchased_accounts')
    .update({
      user_rating: parsed.data.rating,
      user_review: reviewText,
      rated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', session.userId)
    .select('id, product_name, user_rating, user_review, rated_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Không lưu được đánh giá' }, { status: 500 })
  }

  return NextResponse.json({
    account: {
      id: data.id,
      productName: data.product_name,
      userRating: data.user_rating,
      userReview: data.user_review,
      ratedAt: data.rated_at,
    },
  })
}
