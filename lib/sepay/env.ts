/** Chuẩn hóa secret từ env (trim, bỏ quote thừa) */
export function normalizeSepaySecret(value: string | undefined): string {
  if (!value) return ''
  return value.trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
}

export function getSepayApiToken(): string {
  return normalizeSepaySecret(process.env.SEPAY_API_TOKEN)
}

/** Production: userapi.sepay.vn — Sandbox (Test mode): userapi-sandbox.sepay.vn */
export function getSepayApiBaseUrl(): string {
  const explicit = normalizeSepaySecret(process.env.SEPAY_API_BASE_URL)
  if (explicit) return explicit.replace(/\/$/, '')

  const sandbox =
    process.env.SEPAY_API_SANDBOX === 'true' ||
    process.env.SEPAY_API_SANDBOX === '1'
  return sandbox ? 'https://userapi-sandbox.sepay.vn/v2' : 'https://userapi.sepay.vn/v2'
}

export function isSepayApiTokenConfigured(): boolean {
  return getSepayApiToken().length > 0
}

/** Gợi ý khi HTTP 401 từ SePay User API */
export function sepayApiUnauthorizedHint(): string {
  const webhookKey = normalizeSepaySecret(process.env.SEPAY_WEBHOOK_API_KEY)
  const apiToken = getSepayApiToken()
  const sameAsWebhook =
    webhookKey.length > 0 && apiToken.length > 0 && webhookKey === apiToken

  if (sameAsWebhook) {
    return (
      'SEPAY_API_TOKEN đang trùng SEPAY_WEBHOOK_API_KEY — hai khóa khác nhau. ' +
      'Vào my.sepay.vn → Cấu hình công ty → API Access, tạo API Token (Bearer). ' +
      'Webhook API Key chỉ dùng cho SEPAY_WEBHOOK_API_KEY.'
    )
  }

  const sandbox = getSepayApiBaseUrl().includes('sandbox')
  return (
    'Token API SePay không được chấp nhận (401). Kiểm tra: (1) my.sepay.vn → Cấu hình công ty → API Access — ' +
    'sao chép API Token mới vào SEPAY_API_TOKEN trên Vercel rồi Redeploy. ' +
    '(2) KHÔNG dùng API Key webhook. ' +
    (sandbox
      ? '(3) Đang gọi sandbox — token phải tạo trong Test mode trên my.sepay.vn.'
      : '(3) Token Production phải gọi userapi.sepay.vn; nếu tạo token ở Test mode, đặt SEPAY_API_SANDBOX=true.')
  )
}
