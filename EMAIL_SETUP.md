# Cấu hình Email SMTP & Pool slot

## Biến môi trường (`.env.local`)

Dùng **đúng tên** biến sau (thay value sau):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=your@gmail.com
SMTP_ADMIN_EMAIL=admin@example.com
EMAIL_BRAND_NAME=TFlowers Shop
CRON_SECRET=your_random_secret
APP_URL=https://netflixhub.com.vn
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Email tự động

| Sự kiện | Trigger |
|---------|---------|
| Đăng ký | `POST /api/auth/register` |
| Quên mật khẩu | `POST /api/auth/forgot-password` |
| Thanh toán thành công | `POST /api/orders/complete` → email khách |
| **Đơn mới + tồn kho pool** | Cùng lúc → email `SMTP_ADMIN_EMAIL` |
| Nhắc hết hạn 3 ngày / đã hết hạn | `POST /api/cron/expiry-notifications` |

## Migration (Supabase SQL Editor, theo thứ tự)

1. `20260525000000_initial_schema.sql`
2. `20260525100000_purchased_accounts.sql`
3. `20260525200000_email_and_reset.sql`
4. **`20260525300000_streaming_account_pool.sql`** — pool 4 account demo (dư 4/3/2/1 slot)
5. **`20260525400000_short_term_and_ban.sql`** — gói 1/3/7 ngày + bảng `ban_reasons`

## Pool slot & giá

- User chọn **1–4 slot** trên Marketplace; giá = `basePrice × slots × hệ số gói`.
- Hệ thống ưu tiên account có **đúng** số slot dư còn lại (= số slot mua).
- Sau mỗi đơn: `ensureMinimumPool()` giữ ít nhất 1 account dư 1, 2, 3, 4 slot.

## Cron

```bash
# Nhắc hết hạn
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/expiry-notifications

# Duy trì pool (tùy chọn)
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/maintain-pool
```

## API hữu ích

- `GET /api/inventory/slot-options` — slot còn mua được
- `POST /api/orders/complete` — hoàn tất đơn + gán pool + email
