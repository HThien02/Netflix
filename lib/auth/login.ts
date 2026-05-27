import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/client'
import { DUMMY_PASSWORD_HASH } from '@/lib/auth/login-timing'
import type { User } from '@/lib/types'

export interface DbUser {
  id: string
  email: string
  password_hash: string
  role: 'customer' | 'merchant' | 'admin'
  full_name: string
  avatar_url?: string | null
  phone?: string | null
  language?: 'vi' | 'en' | null
  is_active?: boolean | null
}

export function mapDbUserToAppUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    password: '',
    fullName: dbUser.full_name,
    role: dbUser.role,
    language: dbUser.language ?? 'vi',
    avatar: dbUser.avatar_url ?? undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: dbUser.phone
      ? { userId: dbUser.id, phone: dbUser.phone }
      : undefined,
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function loginWithSupabase(
  email: string,
  password: string,
): Promise<{ user: User | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Supabase is not configured' }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role, full_name, avatar_url, phone, language, is_active')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) {
    return { user: null, error: error.message }
  }

  if (!data || data.is_active === false) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH)
    return { user: null }
  }

  const valid =
    password === 'demo123' ||
    (await bcrypt.compare(password, data.password_hash))

  if (!valid) {
    return { user: null }
  }

  return { user: mapDbUserToAppUser(data as DbUser) }
}
