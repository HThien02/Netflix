-- Đảm bảo API (anon/service) ghi/đọc được password_reset_tokens
DROP POLICY IF EXISTS "service_password_reset" ON public.password_reset_tokens;

CREATE POLICY "password_reset_select" ON public.password_reset_tokens
  FOR SELECT
  USING (true);

CREATE POLICY "password_reset_insert" ON public.password_reset_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "password_reset_update" ON public.password_reset_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "password_reset_delete" ON public.password_reset_tokens
  FOR DELETE
  USING (true);
