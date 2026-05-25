export function getBrandName() {
  return process.env.EMAIL_BRAND_NAME || 'NetflixHub'
}

export function getFromAddress() {
  const brand = getBrandName()
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@localhost'
  return `${brand} <${email}>`
}

export function getAdminEmail() {
  return process.env.SMTP_ADMIN_EMAIL || process.env.SMTP_FROM_EMAIL || ''
}
