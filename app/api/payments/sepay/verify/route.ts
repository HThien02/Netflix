import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import { isSepayOrderAlreadyCompleted } from '@/lib/sepay/pending-store'

export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const completed = await isSepayOrderAlreadyCompleted(code)
  if (completed) {
    return NextResponse.json({ paid: true, paymentCode: code })
  }

  return NextResponse.json(
    {
      paid: false,
      paymentCode: code,
      status: 'PENDING',
      hintVi:
        'Chưa nhận được CK hoặc SePay chưa gửi webhook. Kiểm tra đúng số tiền và nội dung CK, đợi 1–5 phút.',
    },
    { status: 402 },
  )
}
