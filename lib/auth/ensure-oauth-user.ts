import bcrypt from 'bcryptjs'
import { mapDbUserToAppUser, type DbUser } from '@/lib/auth/login'
import { createAdminClient } from '@/lib/supabase/admin'
import type { User } from '@/lib/types'

type OAuthProfile = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

function profileName(meta: Record<string, unknown> | null | undefined, email: string): string {
  const name =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    ''
  return name.trim() || email.split('@')[0] || 'User'
}

function profileAvatar(meta: Record<string, unknown> | null | undefined): string | null {
  const url =
    (typeof meta?.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta?.picture === 'string' && meta.picture) ||
    null
  return url?.trim() || null
}

/** Tìm hoặc tạo bản ghi public.users sau đăng nhập Google (Supabase Auth). */
export async function ensureUserFromOAuth(authUser: OAuthProfile): Promise<User> {
  const email = authUser.email?.toLowerCase().trim()
  if (!email) {
    throw new Error('Google account has no email')
  }

  const supabase = createAdminClient()
  const { data: existing, error: findErr } = await supabase
    .from('users')
    .select('id, email, password_hash, role, full_name, avatar_url, phone, language, is_active')
    .eq('email', email)
    .maybeSingle()

  if (findErr) throw new Error(findErr.message)
  if (existing) {
    if (existing.is_active === false) throw new Error('Account is disabled')
    const avatar = profileAvatar(authUser.user_metadata)
    if (avatar && !existing.avatar_url) {
      await supabase.from('users').update({ avatar_url: avatar }).eq('id', existing.id)
      existing.avatar_url = avatar
    }
    return mapDbUserToAppUser(existing as DbUser)
  }

  const password_hash = await bcrypt.hash(`oauth:${authUser.id}:${Date.now()}`, 10)
  const { data: created, error: insertErr } = await supabase
    .from('users')
    .insert({
      email,
      password_hash,
      role: 'customer',
      full_name: profileName(authUser.user_metadata, email),
      avatar_url: profileAvatar(authUser.user_metadata),
      language: 'vi',
    })
    .select('id, email, password_hash, role, full_name, avatar_url, phone, language, is_active')
    .single()

  if (insertErr || !created) {
    throw new Error(insertErr?.message || 'Failed to create user')
  }

  return mapDbUserToAppUser(created as DbUser)
}
