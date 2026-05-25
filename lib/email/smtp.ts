import nodemailer from 'nodemailer'
import { getFromAddress } from '@/lib/email/config'

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      (process.env.SMTP_PASS || process.env.SMTP_PASSWORD) &&
      (process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM),
  )
}

export function createTransporter() {
  const port = Number(process.env.SMTP_PORT || 587)
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
  })
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!isSmtpConfigured()) {
    return { ok: false, skipped: true as const }
  }

  const transporter = createTransporter()
  await transporter.sendMail({
    from: getFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
  return { ok: true as const }
}
