import type { SessionPayload } from '@/lib/auth/session-cookie'

/** Đường dẫn không cần đăng nhập */
const PUBLIC_PREFIXES = ['/', '/marketplace', '/auth']

/** Cần đăng nhập (customer / merchant / admin) */
const USER_PREFIXES = [
  '/cart',
  '/checkout',
  '/my-accounts',
  '/profile',
  '/dashboard',
  '/subscriptions',
  '/support',
  '/vip',
  '/merchant',
]

const ADMIN_PREFIX = '/admin'

export function isPublicPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return true
  if (path.startsWith('/auth')) return true
  if (path.startsWith('/marketplace')) return true
  return false
}

export function requiresUserSession(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (isPublicPath(path)) return false
  if (path.startsWith(ADMIN_PREFIX)) return false
  return USER_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export function requiresAdminSession(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`)
}

export function isAuthFormPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path === '/auth/login' || path === '/auth/signup'
}

export function roleAllowsAdmin(session: SessionPayload): boolean {
  return session.role === 'admin'
}

export function loginRedirectUrl(pathname: string, search: string): string {
  const next = `${pathname}${search}`
  return `/auth/login?next=${encodeURIComponent(next)}`
}
