import { NextResponse } from 'next/server'

/**
 * Phản hồi hợp lệ SePay: HTTP 200/201 + `{"success":true}` trong 30s.
 * @see https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook
 */
export function sepayWebhookOk() {
  return NextResponse.json({ success: true }, { status: 200 })
}
