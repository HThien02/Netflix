-- Ảnh sản phẩm: URL + path denormalized trên products (SELECT nhanh), file trên Storage
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_image_storage_path
  ON public.products (image_storage_path)
  WHERE image_storage_path IS NOT NULL;

COMMENT ON COLUMN public.products.image_url IS
  'URL public (Supabase Storage) — đọc cùng dòng product, không JOIN';
COMMENT ON COLUMN public.products.image_storage_path IS
  'Đường dẫn trong bucket product-images (admin CRUD file)';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
