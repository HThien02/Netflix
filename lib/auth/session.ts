import { loginWithSupabase, isSupabaseConfigured } from '@/lib/auth/login'
import { loginWithDemoFallback } from '@/lib/auth/demo-fallback'
import type { User } from '@/lib/types'

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ user: User | null; source: 'supabase' | 'offline' | null }> {
  if (isSupabaseConfigured()) {
    const { user, error } = await loginWithSupabase(email, password)
    if (user) return { user, source: 'supabase' }
    if (error && !error.includes('not configured')) {
      const offline = loginWithDemoFallback(email, password)
      if (offline) return { user: offline, source: 'offline' }
      return { user: null, source: null }
    }
  }

  const offline = loginWithDemoFallback(email, password)
  if (offline) return { user: offline, source: 'offline' }
  return { user: null, source: null }
}
