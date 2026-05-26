/** Chặn POST API từ domain lạ (CSRF bổ sung cùng SameSite cookie). */
export function isAllowedApiOrigin(request: Request): boolean {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true

  const origin = request.headers.get('origin')
  if (!origin) {
    const fetchSite = request.headers.get('sec-fetch-site')
    if (fetchSite === 'cross-site') return false
    return true
  }

  try {
    const originHost = new URL(origin).host.toLowerCase()
    const host = (request.headers.get('host') || '').toLowerCase()
    if (!host) return false
    if (originHost === host) return true
    if (originHost === 'netflixhub.com.vn' && host === 'www.netflixhub.com.vn') return true
    if (originHost === 'www.netflixhub.com.vn' && host === 'netflixhub.com.vn') return true
    if (process.env.NODE_ENV !== 'production' && originHost.startsWith('localhost')) {
      return host.startsWith('localhost')
    }
    return false
  } catch {
    return false
  }
}
