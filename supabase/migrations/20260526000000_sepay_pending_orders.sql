-- SePay bank-transfer checkout (webhook completes order)
CREATE TABLE IF NOT EXISTS public.sepay_pending_orders (
  payment_code VARCHAR(32) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cart JSONB NOT NULL,
  product_names JSONB NOT NULL DEFAULT '{}'::jsonb,
  language VARCHAR(2) NOT NULL DEFAULT 'vi',
  amount_vnd INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  sepay_transaction_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

CREATE TABLE IF NOT EXISTS public.sepay_webhook_events (
  sepay_transaction_id BIGINT PRIMARY KEY,
  payment_code VARCHAR(32),
  transfer_amount INT NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sepay_pending_user ON public.sepay_pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_sepay_pending_status ON public.sepay_pending_orders(status);

ALTER TABLE public.sepay_pending_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sepay_webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.sepay_pending_orders IS 'SePay CK orders; server uses SUPABASE_SERVICE_ROLE_KEY';
COMMENT ON TABLE public.sepay_webhook_events IS 'Idempotent SePay webhook transaction ids';
