import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-cookie'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { mapDbUserToAppUser } from '@/lib/auth/login'
import { getDemoUserById } from '@/lib/auth/demo-fallback'

export async function GET(request: Request) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ user: null })
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('users')
        .select('id, email, password_hash, role, full_name, avatar_url, phone, language, is_active')
        .eq('id', session.userId)
        .maybeSingle()

      if (!error && data && data.is_active !== false) {
        const user = mapDbUserToAppUser(data)
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            language: user.language,
            avatar: user.avatar,
          },
        })
      }
    } catch {
      /* fallback below */
    }
  }

  const demo = getDemoUserById(session.userId)
  if (demo && demo.email.toLowerCase() === session.email.toLowerCase()) {
    return NextResponse.json({
      user: {
        id: demo.id,
        email: demo.email,
        fullName: demo.fullName,
        role: demo.role,
        language: demo.language,
        avatar: demo.avatar,
      },
    })
  }

  return NextResponse.json({ user: null })
}
