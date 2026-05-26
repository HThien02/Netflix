/** Mã thanh toán SePay (query ?code=NH...) — không phải OAuth Google */
const PAYMENT_CODE = /^NH[A-Z0-9]{4,20}$/i

/** Mã đổi session Supabase OAuth (UUID) */
const OAUTH_AUTH_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const OAUTH_ERROR_CODES = new Set([
  'access_denied',
  'server_error',
  'temporarily_unavailable',
  'interaction_required',
  'org_internal',
  'invalid_request',
  'unauthorized_client',
])

const SKIP_OAUTH_FORWARD_PREFIXES = [
  '/checkout',
  '/cart',
  '/api/payments',
  '/auth/callback',
]

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

export function isPaymentQueryCode(code: string | null): boolean {
  if (!code) return false
  return PAYMENT_CODE.test(code.trim())
}

export function isOAuthAuthCode(code: string | null): boolean {
  if (!code) return false
  return OAUTH_AUTH_CODE.test(code.trim())
}

export function isOAuthProviderError(error: string | null): boolean {
  if (!error) return false
  return OAUTH_ERROR_CODES.has(error.trim().toLowerCase())
}

/** Có nên chuyển request sang /auth/callback? (chỉ OAuth Google, không nhầm SePay/PayOS) */
export function shouldForwardOAuthQueryToCallback(
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  const path = normalizePath(pathname)

  if (SKIP_OAUTH_FORWARD_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return false
  }

  const code = searchParams.get('code')
  const err = searchParams.get('error')
  const errDesc = searchParams.get('error_description')

  if (isPaymentQueryCode(code)) return false

  if (err && isOAuthProviderError(err)) return true
  if (err && errDesc) return true

  if (isOAuthAuthCode(code)) return true

  // Supabase redirect nhầm về Site URL / với UUID
  if (path === '/' && code && !isPaymentQueryCode(code)) return true

  return false
}
