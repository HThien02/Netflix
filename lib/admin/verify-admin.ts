import { requireAdminSession, isSessionResponse } from '@/lib/security/api-auth'

/** @deprecated Dùng session cookie — legacyAdminUserId chỉ dev khi chưa có session admin */
export async function requireAdminUser(
  legacyAdminUserId: string | undefined | null,
  request?: Request,
) {
  if (!request) {
    throw new Error('Unauthorized')
  }
  const admin = await requireAdminSession(request, legacyAdminUserId)
  if (isSessionResponse(admin)) {
    throw new Error(admin.status === 401 ? 'Unauthorized' : 'Forbidden')
  }
  return { id: admin.userId, role: 'admin' as const }
}
