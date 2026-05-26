import { NextResponse } from 'next/server'

/** SePay chỉ chấp nhận đúng body `{"success":true}` — body khác = thất bại / retry */
export function sepayWebhookOk() {
  return NextResponse.json({ success: true })
}
