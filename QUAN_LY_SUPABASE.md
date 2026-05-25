# 📚 HƯỚNG DẪN QUẢN LY NETFLIX SAAS - SUPABASE

## 🎯 GIỚI THIỆU

Đây là hướng dẫn **chi tiết từ A đến Z** cách quản lý database Supabase cho Netflix SaaS Platform.

---

## 📊 CẤU TRÚC DATABASE

### Các Bảng Chính

```
users              ← Bảng người dùng (khách, nhà bán, admin)
products           ← Bảng sản phẩm (gói Netflix, Spotify, etc)
merchant_stores    ← Cửa hàng của nhà bán hàng
inventory          ← Kho sản phẩm
subscriptions      ← Các gói đăng ký của khách hàng
invoices           ← Hóa đơn/biên lai
coupons            ← Mã giảm giá
support_tickets    ← Yêu cầu hỗ trợ
vip_tiers          ← Các cấp độ VIP
user_vip_status    ← Trạng thái VIP của người dùng
```

---

## 🔑 BẢNG USERS (Người Dùng)

### Cấu trúc:
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE    -- Email đăng nhập
password_hash   VARCHAR(255)           -- Mật khẩu mã hóa
role            VARCHAR(50)            -- 'customer', 'merchant', 'admin'
full_name       VARCHAR(255)           -- Họ và tên
avatar_url      VARCHAR(500)           -- Link ảnh đại diện
phone           VARCHAR(20)            -- Số điện thoại
is_active       BOOLEAN                -- Trạng thái hoạt động
created_at      TIMESTAMP              -- Ngày tạo
updated_at      TIMESTAMP              -- Ngày cập nhật
```

### Demo Users (Có sẵn):
| Email | Mật khẩu | Role | Tên |
|-------|----------|------|-----|
| customer1@example.com | demo123 | customer | Nguyễn Văn A |
| customer2@example.com | demo123 | customer | Trần Thị B |
| merchant1@example.com | demo123 | merchant | Hoàng Thị D |
| merchant2@example.com | demo123 | merchant | Bùi Văn E |
| admin@example.com | demo123 | admin | Lê Quốc F |

### Cách Thêm User Mới (Qua SQL):
```sql
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES
('newemail@example.com', '$2b$10$HashedPassword', 'customer', 'Tên người dùng', '0901234567');
```

**Lưu ý:** Dùng bcrypt để hash mật khẩu, KHÔNG lưu plain text!

---

## 📦 BẢNG PRODUCTS (Sản Phẩm)

### Cấu trúc:
```sql
id                  UUID PRIMARY KEY
name                VARCHAR(255)       -- Tên gói (VD: Netflix Premium)
description         TEXT               -- Mô tả
price               DECIMAL(10,2)      -- Giá
duration_months     INT                -- Thời hạn (tháng)
max_screens         INT                -- Số màn hình tối đa
quality             VARCHAR(50)        -- Chất lượng (480p, 1080p, 4K)
discount_percent    DECIMAL(5,2)       -- % giảm giá
rating              DECIMAL(3,1)       -- Đánh giá (0-5)
reviews_count       INT                -- Số bài đánh giá
category            VARCHAR(100)       -- Danh mục (Streaming, Music, etc)
is_active           BOOLEAN            -- Sản phẩm còn bán
created_at          TIMESTAMP          -- Ngày tạo
updated_at          TIMESTAMP          -- Ngày cập nhật
```

### Có sẵn 10 sản phẩm:
- Netflix (Basic, Standard, Premium)
- Amazon Prime Video
- Disney+
- HBO Max
- Spotify Premium
- YouTube Premium
- Hulu
- Paramount+

### Thêm Sản Phẩm Mới:
```sql
INSERT INTO products (name, description, price, duration_months, max_screens, quality, category) VALUES
('Apple TV+', 'Phim gốc Apple', 9.99, 1, 6, '4K', 'Streaming');
```

---

## 🏪 BẢNG MERCHANT_STORES (Cửa Hàng Nhà Bán)

### Cấu trúc:
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users
store_name          VARCHAR(255)       -- Tên cửa hàng
description         TEXT               -- Mô tả
logo_url            VARCHAR(500)       -- Logo
verification_status VARCHAR(50)        -- 'pending', 'verified', 'rejected'
total_sales         DECIMAL(12,2)      -- Tổng doanh số
rating              DECIMAL(3,1)       -- Đánh giá cửa hàng
followers_count     INT                -- Số người theo dõi
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Ví dụ:
```sql
SELECT * FROM merchant_stores WHERE verification_status = 'verified';
-- Xem tất cả cửa hàng đã xác minh
```

---

## 📊 BẢNG SUBSCRIPTIONS (Đăng Ký)

### Cấu trúc:
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users        -- Người dùng
product_id      UUID REFERENCES products    -- Sản phẩm
status          VARCHAR(50)                  -- 'active', 'cancelled', 'expired'
start_date      TIMESTAMP                    -- Ngày bắt đầu
end_date        TIMESTAMP                    -- Ngày kết thúc
auto_renew      BOOLEAN                      -- Gia hạn tự động?
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Truy vấn hữu ích:
```sql
-- Lấy tất cả đăng ký hoạt động
SELECT * FROM subscriptions WHERE status = 'active' AND end_date > NOW();

-- Lấy đăng ký sắp hết hạn (7 ngày)
SELECT * FROM subscriptions 
WHERE end_date < NOW() + INTERVAL '7 days' AND status = 'active';

-- Lấy tổng số tiền khách đã chi tiêu
SELECT user_id, SUM(CAST(final_amount AS DECIMAL)) as total_spent
FROM invoices WHERE user_id = 'USER_ID' AND status = 'completed'
GROUP BY user_id;
```

---

## 💰 BẢNG INVOICES (Hóa Đơn)

### Cấu trúc:
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users
subscription_id     UUID REFERENCES subscriptions
total_amount        DECIMAL(10,2)      -- Tổng giá
tax_amount          DECIMAL(10,2)      -- Thuế
discount_amount     DECIMAL(10,2)      -- Chiết khấu
final_amount        DECIMAL(10,2)      -- Giá cuối (sau thuế & giảm)
status              VARCHAR(50)        -- 'pending', 'completed', 'failed'
payment_method      VARCHAR(50)        -- 'payos', 'card', 'wallet'
invoice_number      VARCHAR(100)       -- Mã hóa đơn (unique)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Truy vấn:
```sql
-- Thống kê doanh thu theo ngày
SELECT DATE(created_at) as date, SUM(final_amount) as revenue
FROM invoices WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Lấy hóa đơn của khách hàng
SELECT * FROM invoices 
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
```

---

## 🎁 BẢNG COUPONS (Mã Giảm Giá)

### Cấu trúc:
```sql
id              UUID PRIMARY KEY
code            VARCHAR(50) UNIQUE     -- Mã (VD: WELCOME10)
discount_percent DECIMAL(5,2)          -- % giảm (hoặc NULL)
discount_fixed  DECIMAL(10,2)          -- Giảm cố định (hoặc NULL)
max_uses        INT                    -- Tối đa lần dùng
current_uses    INT                    -- Số lần đã dùng
expiry_date     TIMESTAMP              -- Hết hạn ngày
is_active       BOOLEAN                -- Còn hoạt động?
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Có sẵn:
- WELCOME10 - 10% giảm (1000 lần dùng)
- SUMMER20 - 20% giảm (500 lần dùng)
- VIP15 - 15% giảm (100 lần dùng)
- NEWYEAR25 - 25% giảm (200 lần dùng)

### Thêm coupon mới:
```sql
INSERT INTO coupons (code, discount_percent, max_uses, expiry_date, is_active) VALUES
('HELLO50', 50, 100, NOW() + INTERVAL '30 days', true);
```

---

## 🎫 BẢNG SUPPORT_TICKETS (Yêu Cầu Hỗ Trợ)

### Cấu trúc:
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users
subject     VARCHAR(255)               -- Tiêu đề
description TEXT                       -- Nội dung
status      VARCHAR(50)                -- 'open', 'in_progress', 'resolved', 'closed'
priority    VARCHAR(50)                -- 'low', 'medium', 'high', 'urgent'
category    VARCHAR(100)               -- Danh mục (billing, technical, etc)
assigned_to UUID REFERENCES users      -- Nhân viên hỗ trợ
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Truy vấn:
```sql
-- Lấy tickets chưa giải quyết
SELECT * FROM support_tickets 
WHERE status IN ('open', 'in_progress')
ORDER BY priority DESC, created_at ASC;

-- Lấy tickets của khách hàng
SELECT * FROM support_tickets 
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
```

---

## ⭐ BẢNG VIP_TIERS (Cấp Độ VIP)

### Có sẵn:
| Level | Tên | Giảm | Lợi ích |
|-------|-----|------|---------|
| 1 | Silver | 5% | Basic support, 1 tháng free/năm |
| 2 | Gold | 10% | VIP support, 3 tháng free/năm |
| 3 | Platinum | 20% | Personal manager, 6 tháng free/năm |

### Cấu trúc:
```sql
id                  UUID PRIMARY KEY
name                VARCHAR(100)       -- Tên (Silver, Gold, Platinum)
level               INT UNIQUE         -- Cấp độ (1, 2, 3)
discount_percent    DECIMAL(5,2)       -- % giảm giá
features            TEXT[]             -- Array lợi ích
minimum_spending    DECIMAL(12,2)      -- Tối thiểu chi tiêu để lên tier
created_at          TIMESTAMP
```

---

## 👑 BẢNG USER_VIP_STATUS (Trạng Thái VIP Người Dùng)

### Cấu trúc:
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users UNIQUE
tier_id         UUID REFERENCES vip_tiers
total_spent     DECIMAL(12,2)          -- Tổng chi tiêu
joined_at       TIMESTAMP              -- Ngày vào tier
updated_at      TIMESTAMP
```

### Truy vấn:
```sql
-- Lấy tất cả VIP Platinum
SELECT u.full_name, u.email, uvs.total_spent
FROM user_vip_status uvs
JOIN vip_tiers vt ON uvs.tier_id = vt.id
JOIN users u ON uvs.user_id = u.id
WHERE vt.level = 3
ORDER BY uvs.total_spent DESC;
```

---

## 🗂️ CÁCH QUẢN LỸ DATABASE

### 1. Truy Cập Supabase Dashboard

1. Vào [supabase.com](https://supabase.com)
2. Đăng nhập tài khoản
3. Chọn project Netflix
4. Click **SQL Editor** bên trái

### 2. Chạy Truy Vấn

```sql
-- Ví dụ: Xem tất cả người dùng
SELECT * FROM users;

-- Xem sản phẩm bán chạy nhất
SELECT p.name, COUNT(s.id) as subscriptions_count
FROM products p
LEFT JOIN subscriptions s ON p.id = s.product_id
GROUP BY p.id
ORDER BY subscriptions_count DESC;
```

### 3. Thêm/Sửa/Xóa Dữ Liệu

**Thêm:**
```sql
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('user@example.com', '$hash', 'customer', 'User Name');
```

**Sửa:**
```sql
UPDATE users SET full_name = 'New Name' WHERE email = 'user@example.com';
```

**Xóa:**
```sql
DELETE FROM users WHERE id = 'USER_ID';
```

---

## 📈 THỐNG KÊ & PHÂN TÍCH

### Doanh Thu Theo Tháng:
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(final_amount) as revenue,
  COUNT(*) as orders
FROM invoices
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Sản Phẩm Phổ Biến Nhất:
```sql
SELECT 
  p.name,
  COUNT(s.id) as subscribers,
  AVG(p.rating) as avg_rating
FROM products p
LEFT JOIN subscriptions s ON p.id = s.product_id
GROUP BY p.id
ORDER BY subscribers DESC
LIMIT 10;
```

### Khách Hàng Giá Trị Cao:
```sql
SELECT 
  u.full_name,
  u.email,
  COUNT(s.id) as subscription_count,
  SUM(i.final_amount) as total_spent
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN invoices i ON u.id = i.user_id
WHERE u.role = 'customer'
GROUP BY u.id
ORDER BY total_spent DESC
LIMIT 20;
```

---

## 🔐 BẢO MẬT

### Quy tắc:
1. **KHÔNG bao giờ** chia sẻ password hash
2. **LUÔN** dùng bcrypt cho mật khẩu
3. **Bật Row Level Security (RLS)** trên tất cả bảng
4. **Backup định kỳ** database

### RLS Policy Ví Dụ:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

---

## 🔗 LIÊN KẾT HỮU ÍCH

| Tính năng | Cách truy cập |
|----------|---------------|
| SQL Editor | Supabase → SQL |
| Table Editor | Supabase → Tables |
| View Database | Supabase → Explorer |
| Backups | Supabase → Backups |
| Logs | Supabase → Logs |

---

## ❓ CÂU HỎI THƯỜNG GẶP

### Q: Làm sao để lấy password hash?
**A:** Dùng bcrypt library:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('password123', 10);
```

### Q: Làm sao để reset mật khẩu người dùng?
**A:**
```sql
UPDATE users SET password_hash = '$2b$10$NEW_HASH' 
WHERE email = 'user@example.com';
```

### Q: Làm sao xóa tất cả đơn hàng của khách?
**A:**
```sql
DELETE FROM invoices WHERE user_id = 'USER_ID';
DELETE FROM subscriptions WHERE user_id = 'USER_ID';
```

### Q: Làm sao thêm 1 tháng cho subscription?
**A:**
```sql
UPDATE subscriptions 
SET end_date = end_date + INTERVAL '1 month'
WHERE id = 'SUBSCRIPTION_ID';
```

---

## 📞 HỖ TRỢ

- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- SQL Help: [postgresql.org](https://www.postgresql.org/)
- Dashboard: [app.supabase.com](https://app.supabase.com)

---

**Cập nhật: 25/05/2026**
