-- Đính kèm ảnh cho ticket hỗ trợ (URL public storage)
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.support_tickets.attachments IS
  'Mảng [{ "url", "name", "mimeType", "size" }] — ảnh jpg/jpeg/png';

-- Bucket lưu file (public để user xem lại ticket của mình)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
