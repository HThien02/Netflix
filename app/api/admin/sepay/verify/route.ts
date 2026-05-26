import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { getSepayApiBaseUrl, getSepayApiToken, sepayApiUnauthorizedHint } from '@/lib/sepay/env'

/** Kiểm tra SEPAY_API_TOKEN có hợp lệ không (gọi GET /bank-accounts) */
export async function GET(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminId, request)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = getSepayApiToken()
  if (!token) {
    return NextResponse.json({
      ok: false,
      error: 'SEPAY_API_TOKEN chưa cấu hình',
    })
  }

  const baseUrl = getSepayApiBaseUrl()
  const res = await fetch(`${baseUrl}/bank-accounts?per_page=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const bodyText = await res.text()
  let body: { status?: string; message?: string } = {}
  try {
    body = JSON.parse(bodyText) as typeof body
  } catch {
    /* ignore */
  }

  if (res.status === 401) {
    return NextResponse.json({
      ok: false,
      httpStatus: 401,
      baseUrl,
      error: sepayApiUnauthorizedHint(),
      raw: body.message || bodyText.slice(0, 200),
    })
  }

  if (!res.ok || body.status !== 'success') {
    return NextResponse.json({
      ok: false,
      httpStatus: res.status,
      baseUrl,
      error: body.message || `SePay API HTTP ${res.status}`,
      raw: bodyText.slice(0, 200),
    })
  }

  return NextResponse.json({
    ok: true,
    baseUrl,
    message: 'SEPAY_API_TOKEN hợp lệ',
  })
}
