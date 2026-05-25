import type { Lang } from '@/lib/translations'
import { getBrandName } from '@/lib/email/config'

import { getSiteUrl } from '@/lib/site'

const appUrl = () => getSiteUrl()

function layout(lang: Lang, title: string, body: string) {
  const appName = getBrandName()
  const footer =
    lang === 'vi'
      ? `© ${new Date().getFullYear()} ${appName}. Email tự động, vui lòng không trả lời.`
      : `© ${new Date().getFullYear()} ${appName}. Automated email, please do not reply.`

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title></head>
<body style="margin:0;background:#0f0f0f;font-family:Segoe UI,Arial,sans-serif;color:#fff;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:28px;font-weight:900;color:#E50914;margin-bottom:24px;">N ${appName}</div>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#888;">${footer}</p>
  </div>
</body></html>`
}

export function welcomeEmail(lang: Lang, fullName: string) {
  const appName = getBrandName()
  if (lang === 'vi') {
    return {
      subject: `Chào mừng đến ${appName}!`,
      html: layout(
        lang,
        'Chào mừng',
        `<h2 style="color:#fff;">Xin chào ${fullName}!</h2>
        <p style="color:#ccc;line-height:1.6;">Tài khoản của bạn đã được tạo thành công. Khám phá gói streaming và quản lý tài khoản tại <strong>Tài khoản của tôi</strong>.</p>
        <a href="${appUrl()}/marketplace" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Khám phá gói dịch vụ</a>`,
      ),
    }
  }
  return {
    subject: `Welcome to ${appName}!`,
    html: layout(
      lang,
      'Welcome',
      `<h2 style="color:#fff;">Hi ${fullName}!</h2>
      <p style="color:#ccc;line-height:1.6;">Your account was created successfully. Browse plans and manage credentials under <strong>My Accounts</strong>.</p>
      <a href="${appUrl()}/marketplace" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Explore plans</a>`,
    ),
  }
}

export function forgotPasswordEmail(lang: Lang, fullName: string, resetUrl: string) {
  if (lang === 'vi') {
    return {
      subject: 'Đặt lại mật khẩu NetflixHub',
      html: layout(
        lang,
        'Quên mật khẩu',
        `<h2 style="color:#fff;">Xin chào ${fullName}</h2>
        <p style="color:#ccc;line-height:1.6;">Chúng tôi nhận yêu cầu đặt lại mật khẩu. Link có hiệu lực 1 giờ.</p>
        <a href="${resetUrl}" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Đặt lại mật khẩu</a>
        <p style="color:#888;font-size:12px;margin-top:16px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
      ),
    }
  }
  return {
    subject: 'Reset your NetflixHub password',
    html: layout(
      lang,
      'Forgot password',
      `<h2 style="color:#fff;">Hi ${fullName}</h2>
      <p style="color:#ccc;line-height:1.6;">We received a password reset request. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Reset password</a>
      <p style="color:#888;font-size:12px;margin-top:16px;">If you did not request this, ignore this email.</p>`,
    ),
  }
}

export function paymentSuccessEmail(
  lang: Lang,
  fullName: string,
  invoiceNumber: string,
  total: string,
  products: string[],
) {
  const list = products.map((p) => `<li style="color:#ccc;">${p}</li>`).join('')
  if (lang === 'vi') {
    return {
      subject: `Thanh toán thành công — ${invoiceNumber}`,
      html: layout(
        lang,
        'Thanh toán',
        `<h2 style="color:#fff;">Cảm ơn ${fullName}!</h2>
        <p style="color:#ccc;">Đơn hàng <strong>${invoiceNumber}</strong> đã thanh toán: <strong>${total}</strong></p>
        <ul>${list}</ul>
        <p style="color:#ccc;">Thông tin đăng nhập gói streaming có tại trang Tài khoản của tôi.</p>
        <a href="${appUrl()}/my-accounts" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Xem tài khoản</a>`,
      ),
    }
  }
  return {
    subject: `Payment successful — ${invoiceNumber}`,
    html: layout(
      lang,
      'Payment',
      `<h2 style="color:#fff;">Thank you ${fullName}!</h2>
      <p style="color:#ccc;">Order <strong>${invoiceNumber}</strong> paid: <strong>${total}</strong></p>
      <ul>${list}</ul>
      <p style="color:#ccc;">Streaming login details are in My Accounts.</p>
      <a href="${appUrl()}/my-accounts" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">View accounts</a>`,
    ),
  }
}

export function expiryReminderEmail(
  lang: Lang,
  fullName: string,
  productName: string,
  expiresAt: string,
  daysLeft: number,
) {
  if (lang === 'vi') {
    return {
      subject: `Nhắc nhở: ${productName} hết hạn sau ${daysLeft} ngày`,
      html: layout(
        lang,
        'Nhắc hết hạn',
        `<h2 style="color:#fff;">Xin chào ${fullName}</h2>
        <p style="color:#ccc;line-height:1.6;">Gói <strong>${productName}</strong> sẽ hết hạn vào <strong>${expiresAt}</strong> (còn ${daysLeft} ngày).</p>
        <a href="${appUrl()}/my-accounts" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Xem thông tin tài khoản</a>`,
      ),
    }
  }
  return {
    subject: `Reminder: ${productName} expires in ${daysLeft} days`,
    html: layout(
      lang,
      'Expiry reminder',
      `<h2 style="color:#fff;">Hi ${fullName}</h2>
      <p style="color:#ccc;line-height:1.6;"><strong>${productName}</strong> expires on <strong>${expiresAt}</strong> (${daysLeft} days left).</p>
      <a href="${appUrl()}/my-accounts" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">View account details</a>`,
    ),
  }
}

export function expiryNoticeEmail(
  lang: Lang,
  fullName: string,
  productName: string,
  expiredAt: string,
) {
  if (lang === 'vi') {
    return {
      subject: `Gói ${productName} đã hết hạn`,
      html: layout(
        lang,
        'Hết hạn',
        `<h2 style="color:#fff;">Xin chào ${fullName}</h2>
        <p style="color:#ccc;line-height:1.6;">Gói <strong>${productName}</strong> đã hết hạn (${expiredAt}). Gia hạn hoặc mua gói mới tại Marketplace.</p>
        <a href="${appUrl()}/marketplace" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Mua gói mới</a>`,
      ),
    }
  }
  return {
    subject: `${productName} has expired`,
    html: layout(
      lang,
      'Expired',
      `<h2 style="color:#fff;">Hi ${fullName}</h2>
      <p style="color:#ccc;line-height:1.6;"><strong>${productName}</strong> expired on ${expiredAt}. Renew or purchase a new plan.</p>
      <a href="${appUrl()}/marketplace" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Browse plans</a>`,
    ),
  }
}

export function adminNewOrderEmail(
  lang: Lang,
  payload: {
    customerName: string
    customerEmail: string
    invoiceNumber: string
    total: string
    productName: string
    slotsCount: number
    slotLines: string[]
    poolSummary: string
  },
) {
  const slotsHtml = payload.slotLines.map((l) => `<li style="color:#ccc;">${l}</li>`).join('')
  if (lang === 'vi') {
    return {
      subject: `[Admin] Đơn mới — ${payload.invoiceNumber}`,
      html: layout(
        lang,
        'Đơn mới',
        `<h2 style="color:#fff;">Có khách hàng mua hàng</h2>
        <p style="color:#ccc;"><strong>${payload.customerName}</strong> (${payload.customerEmail})</p>
        <p style="color:#ccc;">Mã đơn: <strong>${payload.invoiceNumber}</strong> · Tổng: <strong>${payload.total}</strong></p>
        <p style="color:#ccc;">Sản phẩm: <strong>${payload.productName}</strong> · <strong>${payload.slotsCount} slot</strong></p>
        <ul>${slotsHtml}</ul>
        <hr style="border-color:#333;"/>
        <h3 style="color:#E50914;">Tồn kho pool</h3>
        <pre style="color:#aaa;font-size:13px;white-space:pre-wrap;">${payload.poolSummary}</pre>`,
      ),
    }
  }
  return {
    subject: `[Admin] New order — ${payload.invoiceNumber}`,
    html: layout(
      lang,
      'New order',
      `<h2 style="color:#fff;">New customer purchase</h2>
      <p style="color:#ccc;"><strong>${payload.customerName}</strong> (${payload.customerEmail})</p>
      <p style="color:#ccc;">Order: <strong>${payload.invoiceNumber}</strong> · Total: <strong>${payload.total}</strong></p>
      <p style="color:#ccc;">Product: <strong>${payload.productName}</strong> · <strong>${payload.slotsCount} slot(s)</strong></p>
      <ul>${slotsHtml}</ul>
      <hr style="border-color:#333;"/>
      <h3 style="color:#E50914;">Pool inventory</h3>
      <pre style="color:#aaa;font-size:13px;white-space:pre-wrap;">${payload.poolSummary}</pre>`,
    ),
  }
}

export function accountBannedEmail(
  lang: Lang,
  fullName: string,
  payload: {
    productName: string
    reasonTitle: string
    reasonDescription: string
    adminNote: string
  },
) {
  const noteBlock = payload.adminNote
    ? `<p style="color:#ccc;"><strong>${lang === 'vi' ? 'Ghi chú' : 'Note'}:</strong> ${payload.adminNote}</p>`
    : ''
  if (lang === 'vi') {
    return {
      subject: `Tài khoản ${payload.productName} đã bị thu hồi`,
      html: layout(
        lang,
        'Thu hồi tài khoản',
        `<h2 style="color:#fff;">Xin chào ${fullName}</h2>
        <p style="color:#ccc;line-height:1.6;">Gói <strong>${payload.productName}</strong> bạn đang thuê đã bị <strong style="color:#E50914;">thu hồi</strong> bởi quản trị viên.</p>
        <div style="background:#1a1a1a;border-left:4px solid #E50914;padding:16px;margin:16px 0;">
          <p style="color:#fff;margin:0 0 8px;"><strong>Lý do:</strong> ${payload.reasonTitle}</p>
          <p style="color:#aaa;margin:0;font-size:14px;">${payload.reasonDescription}</p>
        </div>
        ${noteBlock}
        <p style="color:#888;font-size:13px;">Bạn không còn quyền sử dụng thông tin đăng nhập đã cấp. Nếu cho rằng đây là nhầm lẫn, vui lòng liên hệ hỗ trợ.</p>
        <a href="${appUrl()}/support/tickets" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Liên hệ hỗ trợ</a>`,
      ),
    }
  }
  return {
    subject: `${payload.productName} rental revoked`,
    html: layout(
      lang,
      'Account revoked',
      `<h2 style="color:#fff;">Hi ${fullName}</h2>
      <p style="color:#ccc;line-height:1.6;">Your rental for <strong>${payload.productName}</strong> has been <strong style="color:#E50914;">revoked</strong> by an administrator.</p>
      <div style="background:#1a1a1a;border-left:4px solid #E50914;padding:16px;margin:16px 0;">
        <p style="color:#fff;margin:0 0 8px;"><strong>Reason:</strong> ${payload.reasonTitle}</p>
        <p style="color:#aaa;margin:0;font-size:14px;">${payload.reasonDescription}</p>
      </div>
      ${noteBlock}
      <p style="color:#888;font-size:13px;">You may no longer use the credentials provided. Contact support if you believe this is a mistake.</p>
      <a href="${appUrl()}/support/tickets" style="display:inline-block;margin-top:16px;background:#E50914;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Contact support</a>`,
    ),
  }
}
