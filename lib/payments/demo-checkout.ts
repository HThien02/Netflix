/** Chỉ bật demo checkout (hoàn tất đơn không CK) khi dev hoặc ALLOW_DEMO_CHECKOUT=true */
export function isDemoCheckoutAllowed(): boolean {
  if (process.env.ALLOW_DEMO_CHECKOUT === 'true') return true
  return process.env.NODE_ENV === 'development'
}
