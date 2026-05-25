-- Password reset + email notification tracking

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens(token);

ALTER TABLE public.purchased_accounts
  ADD COLUMN IF NOT EXISTS reminder_3d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_notice_sent_at TIMESTAMPTZ;

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_password_reset" ON public.password_reset_tokens FOR ALL USING (true);
