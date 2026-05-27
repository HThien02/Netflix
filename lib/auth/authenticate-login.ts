import { authenticateUser } from '@/lib/auth/session'

/** loginWithSupabase đã luôn chạy bcrypt.compare một lần trước khi trả lỗi */
export async function authenticateLoginSafe(
  email: string,
  password: string,
): Promise<{ user: Awaited<ReturnType<typeof authenticateUser>>['user']; source: Awaited<ReturnType<typeof authenticateUser>>['source'] }> {
  return authenticateUser(email, password)
}
