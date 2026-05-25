-- Pending PayOS checkouts (webhook + finish without browser cookie)
CREATE TABLE IF NOT EXISTS public.payos_pending_orders (
  order_code BIGINT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cart JSONB NOT NULL,
  product_names JSONB NOT NULL DEFAULT '{}'::jsonb,
  language VARCHAR(2) NOT NULL DEFAULT 'vi',
  amount_vnd INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_payos_pending_user ON public.payos_pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payos_pending_status ON public.payos_pending_orders(status);
