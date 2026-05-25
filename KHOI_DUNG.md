# 🚀 KHỞI ĐỘNG NETFLIX SAAS

## ⚡ Bước 1: Chạy Ứng Dụng

```bash
cd /vercel/share/v0-project
pnpm dev
```

Ứng dụng sẽ chạy ở: **http://localhost:3000**

---

## 🔐 Bước 2: Đăng Nhập

### Cách 1: Click Nút Demo (Nhanh nhất)
1. Vào trang Login
2. Click 1 trong 3 nút: **Khách hàng** | **Nhà bán** | **Quản trị**
3. Tự động đăng nhập, không cần nhập mật khẩu

### Cách 2: Nhập Email & Mật khẩu

| Email | Mật khẩu | Role |
|-------|----------|------|
| customer1@example.com | demo123 | Khách hàng |
| merchant1@example.com | demo123 | Nhà bán hàng |
| admin@example.com | demo123 | Quản trị viên |

---

## 🎯 Bước 3: Khám Phá Tính Năng

### 👤 Khách Hàng (Customer)
- ✅ Duyệt Marketplace → Xem 10+ sản phẩm
- ✅ Thêm vào giỏ hàng
- ✅ Áp dụng mã coupon (WELCOME10, SUMMER20, etc)
- ✅ Thanh toán → Xem confetti 🎉
- ✅ Quản lý Subscription
- ✅ Xem Dashboard với biểu đồ
- ✅ Gửi Support Ticket
- ✅ Xem VIP Membership

### 🏪 Nhà Bán Hàng (Merchant)
- ✅ Dashboard với doanh số bán hàng
- ✅ Thống kê revenue & orders
- ✅ Quản lý inventory
- ✅ Xem list khách hàng

### 👨‍💼 Quản Trị Viên (Admin)
- ✅ Admin Dashboard toàn diện
- ✅ Thống kê người dùng
- ✅ Thống kê doanh thu
- ✅ Quản lý tất cả đơn hàng

---

## 🌐 Bước 4: Thay Đổi Ngôn Ngữ

1. Click biểu tượng **Người dùng** (mặc định: English)
2. Chọn **Tiếng Việt** hoặc **English**
3. Trang sẽ tự động dịch sang ngôn ngữ được chọn

**Ghi chú:** Ngôn ngữ được lưu trong localStorage, vậy lần tới vẫn dùng ngôn ngữ đó.

---

## 📊 Bước 5: Quản Lý Database (Supabase)

### Truy Cập Dashboard:
1. Vào [supabase.com](https://supabase.com)
2. Đăng nhập tài khoản của bạn
3. Chọn project Netflix
4. Click **SQL Editor** để chạy truy vấn

### Các Lệnh SQL Hữu Ích:

```sql
-- Xem tất cả người dùng
SELECT * FROM users;

-- Xem tất cả sản phẩm
SELECT name, price, rating FROM products;

-- Xem doanh thu hôm nay
SELECT SUM(final_amount) as revenue 
FROM invoices 
WHERE DATE(created_at) = TODAY();

-- Xem subscription hoạt động
SELECT * FROM subscriptions WHERE status = 'active';
```

📖 **Hướng dẫn chi tiết:** Xem file `QUAN_LY_SUPABASE.md`

---

## 🎨 Bước 6: Tùy Chỉnh Giao Diện

### Đổi Màu Netflix:
1. Mở file `app/globals.css`
2. Tìm dòng `--primary: #E50914` (màu đỏ)
3. Đổi thành màu khác, VD: `#FF6B35`

### Các Màu Được Dùng:
```css
--primary: #E50914        /* Đỏ Netflix */
--background: #0f0f0f     /* Đen */
--card: #1a1a1a           /* Xám đen */
--text: #ffffff           /* Trắng */
```

---

## 📁 Cấu Trúc Thư Mục

```
netflix-saas/
├── app/
│   ├── page.tsx              ← Landing page
│   ├── auth/
│   │   ├── login/            ← Đăng nhập
│   │   ├── signup/           ← Đăng ký
│   │   └── callback/         ← Supabase auth
│   ├── marketplace/          ← Duyệt sản phẩm
│   ├── cart/                 ← Giỏ hàng
│   ├── checkout/             ← Thanh toán
│   ├── dashboard/            ← Dashboard khách
│   ├── subscriptions/        ← Quản lý subscription
│   ├── merchant/dashboard/   ← Dashboard nhà bán
│   ├── admin/dashboard/      ← Dashboard admin
│   ├── support/tickets/      ← Support tickets
│   ├── profile/              ← Profile người dùng
│   └── vip/                  ← VIP membership
├── lib/
│   ├── supabase/            ← Supabase client
│   ├── context.tsx          ← State management
│   ├── types.ts             ← TypeScript types
│   ├── translations.ts      ← Tiếng Việt + English
│   └── mock-data.ts         ← Sample data (old, use DB now)
├── components/
│   ├── app-layout.tsx       ← Main layout & nav
│   ├── product-card.tsx     ← Product card
│   └── ui/                  ← shadcn components
├── middleware.ts            ← Auth middleware
└── tailwind.config.ts       ← Tailwind config
```

---

## 🔧 Cài Đặt Thêm

### Cài Đặt Mới Dependencies:
```bash
pnpm add PACKAGE_NAME
```

### Build Cho Production:
```bash
pnpm build
```

### Test Production Build:
```bash
pnpm start
```

---

## 🐛 Gỡ Lỗi

### Lỗi: "Cannot find module"
**Giải pháp:** Chạy `pnpm install`

### Lỗi: "Port 3000 đang được dùng"
**Giải pháp:** Chạy trên port khác:
```bash
pnpm dev -- -p 3001
```

### Lỗi: "Supabase connection failed"
**Giải pháp:** Kiểm tra `.env.local` có chứa:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 📱 Tính Năng Chính

| Tính Năng | Mô Tả |
|----------|-------|
| 🔐 Authentication | Đăng nhập với auto-detect role |
| 🛒 Marketplace | Duyệt 10+ sản phẩm premium |
| 💳 Payment | Thanh toán với confetti animation |
| 📊 Dashboard | Analytics & charts |
| 🎁 Coupons | 4 mã giảm giá có sẵn |
| 👤 Profile | Quản lý thông tin cá nhân |
| 💬 Support | Gửi ticket hỗ trợ |
| ⭐ VIP | 3 cấp độ membership (Silver/Gold/Platinum) |
| 🌍 Language | Tiếng Việt + English |
| 📱 Responsive | Mobile-first design |

---

## 📞 Liên Hệ & Hỗ Trợ

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com

---

## ✅ Checklist Bắt Đầu

- [ ] Chạy `pnpm dev`
- [ ] Mở http://localhost:3000
- [ ] Click nút Demo đăng nhập
- [ ] Duyệt Marketplace
- [ ] Thêm sản phẩm vào giỏ
- [ ] Thanh toán & xem confetti
- [ ] Vào Dashboard xem stats
- [ ] Đổi sang Tiếng Việt
- [ ] Truy cập Supabase Dashboard
- [ ] Chạy SQL query

---

**Chúc bạn sử dụng vui vẻ! 🎉**
