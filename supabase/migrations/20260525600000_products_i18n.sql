-- Tên/mô tả tiếng Anh cho sản phẩm marketplace (admin CRUD)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description_en TEXT;
