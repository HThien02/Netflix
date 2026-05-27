import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { purchasedAccountUserEmbed } from '@/lib/supabase/embeds'
import {
  sendExpiryReminderEmail,
  sendExpiryNoticeEmail,
} from '@/lib/email/send'

function formatDate(d: Date, lang: 'vi' | 'en') {
  return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    || new URL(request.url).searchParams.get('secret')

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const in3days = new Date(now)
  in3days.setDate(in3days.getDate() + 3)
  const in4days = new Date(now)
  in4days.setDate(in4days.getDate() + 4)

  let reminders = 0
  let expired = 0

  // Nhắc trước 3 ngày (cửa sổ 24h)
  const { data: soon } = await supabase
    .from('purchased_accounts')
    .select(`id, user_id, product_name, expires_at, ${purchasedAccountUserEmbed} ( email, full_name, language )`)
    .eq('status', 'active')
    .is('reminder_3d_sent_at', null)
    .gte('expires_at', in3days.toISOString())
    .lt('expires_at', in4days.toISOString())

  for (const row of soon || []) {
    const u = (Array.isArray(row.users) ? row.users[0] : row.users) as {
      email: string
      full_name: string
      language: string
    } | null
    if (!u?.email) continue
    const lang = (u.language === 'en' ? 'en' : 'vi') as 'vi' | 'en'
    const exp = new Date(row.expires_at)
    await sendExpiryReminderEmail(
      u.email,
      u.full_name,
      lang,
      row.product_name,
      formatDate(exp, lang),
      3,
    )
    await supabase
      .from('purchased_accounts')
      .update({ reminder_3d_sent_at: now.toISOString() })
      .eq('id', row.id)
    reminders++
  }

  // Đã hết hạn
  const { data: ended } = await supabase
    .from('purchased_accounts')
    .select(`id, user_id, product_name, expires_at, ${purchasedAccountUserEmbed} ( email, full_name, language )`)
    .eq('status', 'active')
    .is('expiry_notice_sent_at', null)
    .lt('expires_at', now.toISOString())

  for (const row of ended || []) {
    const u = (Array.isArray(row.users) ? row.users[0] : row.users) as {
      email: string
      full_name: string
      language: string
    } | null
    if (!u?.email) continue
    const lang = (u.language === 'en' ? 'en' : 'vi') as 'vi' | 'en'
    const exp = new Date(row.expires_at)
    await sendExpiryNoticeEmail(u.email, u.full_name, lang, row.product_name, formatDate(exp, lang))
    await supabase
      .from('purchased_accounts')
      .update({
        status: 'expired',
        expiry_notice_sent_at: now.toISOString(),
      })
      .eq('id', row.id)
    expired++
  }

  return NextResponse.json({ ok: true, reminders, expired })
}
