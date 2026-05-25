# HƯỚNG DẪN SETUP SUPABASE - NETFLIX SAAS

## TÓM TẮT

Supabase của bạn đã được kết nối và dữ liệu mẫu đã được chèn vào. Ứng dụng sẵn sàng chạy!

---

## SUPABASE CREDENTIALS

Copy `.env.example` → `.env.local` và điền URL + anon key từ Supabase Dashboard → Settings → API.

Chi tiết: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

---

## DATABASE TABLES (10 bảng)

| Bảng | Mục Đích | Dòng |
|------|----------|------|
| users | Lưu thông tin người dùng | 6 |
| products | Lưu sản phẩm streaming | 10 |
| merchant_stores | Lưu cửa hàng nhà bán | 2 |
| inventory | Lưu kho hàng theo sản phẩm | 3 |
| subscriptions | Lưu gói đăng ký của người dùng | 4 |
| invoices | Lưu hóa đơn thanh toán | 4 |
| coupons | Lưu mã giảm giá | 4 |
| support_tickets | Lưu ticket hỗ trợ | 3 |
| vip_tiers | Lưu cấp độ VIP (Silver/Gold/Platinum) | 3 |
| user_vip_status | Lưu trạng thái VIP của người dùng | 2 |

**Tổng cộng:** 41 dòng dữ liệu mẫu

---

## DEMO ACCOUNTS (6 user)

Tất cả mật khẩu là: **demo123**

### Khách Hàng (Customers)
| Email | Tên | UUID |
|-------|-----|------|
| customer1@example.com | Nguyễn Văn A | 550e8400-e29b-41d4-a716-446655440001 |
| customer2@example.com | Trần Thị B | 550e8400-e29b-41d4-a716-446655440002 |
| customer3@example.com | Phạm Văn C | 550e8400-e29b-41d4-a716-446655440003 |

### Nhà Bán (Merchants)
| Email | Tên | UUID |
|-------|-----|------|
| merchant1@example.com | Hoàng Thị D | 550e8400-e29b-41d4-a716-446655440004 |
| merchant2@example.com | Bùi Văn E | 550e8400-e29b-41d4-a716-446655440005 |

### Quản Trị (Admin)
| Email | Tên | UUID |
|-------|-----|------|
| admin@example.com | Lê Quốc F | 550e8400-e29b-41d4-a716-446655440006 |

---

## SAMPLE DATA

### Products (10 sản phẩm)
- Netflix Basic - $6.99 (480p, 1 màn)
- Netflix Standard - $15.49 (1080p, 2 màn)
- Netflix Premium - $22.99 (4K, 4 màn)
- Amazon Prime Video - $14.99
- Disney+ - $10.99
- HBO Max - $19.99
- Spotify Premium - $9.99
- YouTube Premium - $13.99
- Hulu - $7.99
- Paramount+ - $11.99

### Coupons (4 mã giảm giá)
| Mã | Giảm | Lần dùng | Hết hạn |
|----|------|---------|--------|
| WELCOME10 | 10% | 1000 | +30 ngày |
| SUMMER20 | 20% | 500 | +60 ngày |
| VIP15 | 15% | 100 | +90 ngày |
| NEWYEAR25 | 25% | 200 | +45 ngày |

### VIP Tiers (3 cấp)
| Cấp | Tên | Giảm | Yêu cầu |
|-----|-----|------|--------|
| 1 | Silver | 5% | $500 |
| 2 | Gold | 10% | $2000 |
| 3 | Platinum | 20% | $5000 |

---

## CẤU HÌNH SUPABASE (trong ứng dụng)

Các file cấu hình Supabase:

```
lib/supabase/
├── client.ts       ← Browser client (SSR)
├── server.ts       ← Server client
├── proxy.ts        ← Proxy configuration
└── queries.ts      ← Reusable database queries
```

### Environment Variables (cần thiết)

Các biến này sẽ được tự động cấu hình bởi v0 từ Supabase integration:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## CÁCH LẤY DỮ LIỆU TỪ SUPABASE

### Ví dụ: Lấy tất cả sản phẩm (Client-side)

```typescript
import { createClient } from '@/lib/supabase/client'

export async function getProducts() {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
  
  return data
}
```

### Ví dụ: Lấy user từ email (Server-side)

```typescript
import { createClient } from '@/lib/supabase/server'

export async function getUserByEmail(email: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  return data
}
```

### Reusable Queries

File `lib/supabase/queries.ts` có các hàm sẵn:

```typescript
// Lấy sản phẩm
import { getProducts, getProduct } from '@/lib/supabase/queries'

// Lấy user
import { getUserByEmail } from '@/lib/supabase/queries'

// Lấy subscription
import { getUserSubscriptions } from '@/lib/supabase/queries'

// Lấy invoice
import { getUserInvoices } from '@/lib/supabase/queries'

// ... và nhiều hàm khác
```

---

## QUẢN LÝ DỮ LIỆU (Supabase Dashboard)

### Truy cập Supabase Console

1. Vào: https://app.supabase.com
2. Đăng nhập với tài khoản của bạn
3. Chọn project **Netflix** (hoặc tên project của bạn)

### Xem dữ liệu

1. Click **SQL Editor** (hoặc **Table Editor**)
2. Chọn bảng muốn xem
3. Xem, thêm, sửa, xóa dữ liệu

### Chạy SQL custom

```sql
-- Lấy tất cả khách hàng
SELECT * FROM users WHERE role = 'customer';

-- Lấy tất cả sản phẩm active
SELECT * FROM products WHERE is_active = true;

-- Lấy doanh thu theo merchant
SELECT merchant_id, SUM(total_amount) as total
FROM invoices
GROUP BY merchant_id;
```

---

## BACKUP & RESTORE

### Backup dữ liệu

1. Vào Supabase Dashboard
2. Settings → Database → Backups
3. Click **Create backup now**

### Export dữ liệu

Chạy SQL:
```sql
SELECT * FROM users
UNION ALL
SELECT * FROM products;
```

---

## SECURITY (Bảo Mật)

### 1. Regenerate Keys (NGAY)

Vì publishable key đã bị lộ:
1. Vào Supabase Dashboard
2. Settings → API → Regenerate keys
3. Update biến môi trường mới

### 2. Row Level Security (RLS)

Hiện tại: **KHÔNG BẬT** (cho phép dev test)

Khi production:
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

### 3. Chỉ cho phép người dùng xem data của họ

```sql
-- Users chỉ xem subscription của chính họ
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## TROUBLESHOOTING

### "Connect EREFUSED"
- Kiểm tra SUPABASE_URL chính xác
- Kiểm tra internet connection

### "Invalid API key"
- Regenerate key ở Supabase Dashboard
- Update .env

### "No data returned"
- Kiểm tra dữ liệu có tồn tại bằng Supabase Console
- Kiểm tra filter conditions

---

## THÊM BẢNG MỚI

### 1. Tạo bảng ở Supabase Console

```sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Sử dụng ở ứng dụng

```typescript
const { data } = await supabase.from('my_table').select('*')
```

---

## THÊM DỮ LIỆU MỚI

### 1. Programmatically (Code)

```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    id: 'new-id',
    name: 'New Product',
    price: 9.99,
    category: 'Streaming'
  })
```

### 2. Supabase Console

1. Vào Table Editor
2. Click nút **+** ở header
3. Nhập dữ liệu
4. Click Save

---

## NEXT STEPS

✅ Database setup xong  
✅ Dữ liệu mẫu inserted  
✅ App sẵn sàng chạy  

Tiếp theo:
1. Chạy `pnpm dev`
2. Đăng nhập với demo account
3. Test marketplace
4. Kiểm tra analytics
5. Deploy (tùy chọn)

---

**Lưu ý:** Tất cả dữ liệu bạn nhập vào sẽ được lưu vào Supabase automatically.
