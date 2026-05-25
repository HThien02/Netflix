import { sendEmail } from '@/lib/email/smtp'
import {
  welcomeEmail,
  forgotPasswordEmail,
  paymentSuccessEmail,
  expiryReminderEmail,
  expiryNoticeEmail,
  adminNewOrderEmail,
  accountBannedEmail,
} from '@/lib/email/templates'
import { getAdminEmail } from '@/lib/email/config'
import type { Lang } from '@/lib/translations'

export async function sendWelcomeEmail(to: string, fullName: string, lang: Lang) {
  const { subject, html } = welcomeEmail(lang, fullName)
  return sendEmail({ to, subject, html })
}

export async function sendForgotPasswordEmail(
  to: string,
  fullName: string,
  resetUrl: string,
  lang: Lang,
) {
  const { subject, html } = forgotPasswordEmail(lang, fullName, resetUrl)
  return sendEmail({ to, subject, html })
}

export async function sendPaymentSuccessEmail(
  to: string,
  fullName: string,
  lang: Lang,
  invoiceNumber: string,
  total: string,
  products: string[],
) {
  const { subject, html } = paymentSuccessEmail(lang, fullName, invoiceNumber, total, products)
  return sendEmail({ to, subject, html })
}

export async function sendExpiryReminderEmail(
  to: string,
  fullName: string,
  lang: Lang,
  productName: string,
  expiresAt: string,
  daysLeft: number,
) {
  const { subject, html } = expiryReminderEmail(lang, fullName, productName, expiresAt, daysLeft)
  return sendEmail({ to, subject, html })
}

export async function sendAdminNewOrderEmail(
  lang: Lang,
  payload: Parameters<typeof adminNewOrderEmail>[1],
) {
  const admin = getAdminEmail()
  if (!admin) {
    return { ok: false, skipped: true as const }
  }
  const { subject, html } = adminNewOrderEmail(lang, payload)
  return sendEmail({ to: admin, subject, html })
}

export async function sendAccountBannedEmail(
  to: string,
  fullName: string,
  lang: Lang,
  payload: Parameters<typeof accountBannedEmail>[2],
) {
  const { subject, html } = accountBannedEmail(lang, fullName, payload)
  return sendEmail({ to, subject, html })
}

export async function sendExpiryNoticeEmail(
  to: string,
  fullName: string,
  lang: Lang,
  productName: string,
  expiredAt: string,
) {
  const { subject, html } = expiryNoticeEmail(lang, fullName, productName, expiredAt)
  return sendEmail({ to, subject, html })
}
