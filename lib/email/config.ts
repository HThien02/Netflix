import { SITE_DOMAIN, SITE_NAME } from '@/lib/site'

export function getBrandName() {
  return process.env.EMAIL_BRAND_NAME || SITE_NAME
}

export function getFromAddress() {
  const brand = getBrandName()
  const email =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    `noreply@${SITE_DOMAIN}`
  return `${brand} <${email}>`
}

export function getAdminEmail() {
  return process.env.SMTP_ADMIN_EMAIL || process.env.SMTP_FROM_EMAIL || ''
}
