-- Purchased streaming accounts (credentials delivered after payment)

CREATE TABLE IF NOT EXISTS public.purchased_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'monthly',
  service_email VARCHAR(255) NOT NULL,
  service_password VARCHAR(255) NOT NULL,
  profile_name VARCHAR(100),
  extra_notes TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchased_accounts_user ON public.purchased_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_accounts_status ON public.purchased_accounts(user_id, status);

DROP TRIGGER IF EXISTS trg_purchased_accounts_updated_at ON public.purchased_accounts;
CREATE TRIGGER trg_purchased_accounts_updated_at
  BEFORE UPDATE ON public.purchased_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.purchased_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_purchased_accounts" ON public.purchased_accounts
  FOR SELECT USING (true);

CREATE POLICY "users_insert_own_purchased_accounts" ON public.purchased_accounts
  FOR INSERT WITH CHECK (true);

-- Demo: active account for customer1 (run after initial_schema)
INSERT INTO public.purchased_accounts (
  id, user_id, product_id, product_name, plan_type,
  service_email, service_password, profile_name, extra_notes, expires_at, status
) VALUES (
  'ff0e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440003',
  'Netflix Premium',
  'monthly',
  'netflix.premium.demo@streamhub.app',
  'NxPrem2026!',
  'Profile 1',
  '4K HDR · 4 screens · Do not change password',
  NOW() + INTERVAL '15 days',
  'active'
) ON CONFLICT (id) DO NOTHING;
