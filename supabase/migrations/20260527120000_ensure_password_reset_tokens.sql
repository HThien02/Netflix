-- Chạy file này nếu forgot-password báo lỗi (bảng chưa tồn tại)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens(token);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_password_reset" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "password_reset_select" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "password_reset_insert" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "password_reset_update" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "password_reset_delete" ON public.password_reset_tokens;

CREATE POLICY "password_reset_select" ON public.password_reset_tokens FOR SELECT USING (true);
CREATE POLICY "password_reset_insert" ON public.password_reset_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "password_reset_update" ON public.password_reset_tokens FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "password_reset_delete" ON public.password_reset_tokens FOR DELETE USING (true);
