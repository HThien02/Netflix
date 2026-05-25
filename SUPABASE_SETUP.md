# Supabase setup (Netflix SaaS)

## 1. Tạo project Supabase

1. Vào [supabase.com](https://supabase.com) → **New project**
2. Chọn region, đặt mật khẩu database, đợi project khởi tạo xong

## 2. Chạy migration

1. Mở **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ file `supabase/migrations/20260525000000_initial_schema.sql`
3. **Run** — tạo 10 bảng + dữ liệu mẫu (41 rows)

Hoặc dùng Supabase CLI (nếu đã cài):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

## 3. Cấu hình app

```bash
cp .env.example .env.local
```

Điền từ **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon / publishable key)

## 4. Chạy ứng dụng

```bash
npm install
npm run dev
```

Mở http://localhost:3000 → đăng nhập demo (mật khẩu `demo123`):

| Role | Email |
|------|-------|
| Customer | customer1@example.com |
| Merchant | merchant1@example.com |
| Admin | admin@example.com |

## 5. Kiểm tra kết nối

Trong SQL Editor:

```sql
SELECT email, role, full_name FROM users;
SELECT name, price FROM products WHERE is_active = true;
```

## Bảo mật production

- Bật RLS chặt hơn (hiện migration dùng policy `SELECT` mở cho demo)
- Không commit `.env.local`
- Đổi mật khẩu demo hoặc tắt tài khoản `is_active = false`
- Cân nhắc Supabase Auth thay cho bảng `users.password_hash`
