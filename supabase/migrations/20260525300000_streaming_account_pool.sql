-- Pool tài khoản streaming theo slot (1–4)

CREATE TABLE IF NOT EXISTS public.streaming_account_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_email VARCHAR(255) NOT NULL,
  service_password VARCHAR(255) NOT NULL,
  max_slots INT NOT NULL DEFAULT 4 CHECK (max_slots >= 1 AND max_slots <= 4),
  slots_used INT NOT NULL DEFAULT 0 CHECK (slots_used >= 0),
  slot_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'full', 'disabled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT slots_used_lte_max CHECK (slots_used <= max_slots)
);

CREATE INDEX IF NOT EXISTS idx_pool_product_status ON public.streaming_account_pool(product_id, status);
CREATE INDEX IF NOT EXISTS idx_pool_free_slots ON public.streaming_account_pool((max_slots - slots_used));

ALTER TABLE public.purchased_accounts
  ADD COLUMN IF NOT EXISTS slots_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pool_account_id UUID REFERENCES public.streaming_account_pool(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slot_assignments JSONB DEFAULT '[]'::jsonb;

DROP TRIGGER IF EXISTS trg_streaming_account_pool_updated_at ON public.streaming_account_pool;
CREATE TRIGGER trg_streaming_account_pool_updated_at
  BEFORE UPDATE ON public.streaming_account_pool
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.streaming_account_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pool" ON public.streaming_account_pool FOR SELECT USING (true);
CREATE POLICY "public_update_pool" ON public.streaming_account_pool FOR UPDATE USING (true);
CREATE POLICY "public_insert_pool" ON public.streaming_account_pool FOR INSERT WITH CHECK (true);

-- Seed pool: 4 accounts — dư 4, 3, 2, 1 slot
INSERT INTO public.streaming_account_pool (
  id, product_id, service_email, service_password, max_slots, slots_used, slot_details, status
) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440101', '660e8400-e29b-41d4-a716-446655440003',
   'pool.4slot.demo@streamhub.app', 'Pool4Slot2026!', 4, 0,
   '[{"slot_number":1,"profile_name":"Profile 1","pin":"1001"},{"slot_number":2,"profile_name":"Profile 2","pin":"1002"},{"slot_number":3,"profile_name":"Profile 3","pin":"1003"},{"slot_number":4,"profile_name":"Profile 4","pin":"1004"}]'::jsonb,
   'active'),
  ('aa0e8400-e29b-41d4-a716-446655440102', '660e8400-e29b-41d4-a716-446655440003',
   'pool.3slot.demo@streamhub.app', 'Pool3Slot2026!', 4, 1,
   '[{"slot_number":1,"profile_name":"Profile 1","pin":"2001"},{"slot_number":2,"profile_name":"Profile 2","pin":"2002"},{"slot_number":3,"profile_name":"Profile 3","pin":"2003"},{"slot_number":4,"profile_name":"Profile 4","pin":"2004"}]'::jsonb,
   'active'),
  ('aa0e8400-e29b-41d4-a716-446655440103', '660e8400-e29b-41d4-a716-446655440003',
   'pool.2slot.demo@streamhub.app', 'Pool2Slot2026!', 4, 2,
   '[{"slot_number":1,"profile_name":"Profile 1","pin":"3001"},{"slot_number":2,"profile_name":"Profile 2","pin":"3002"},{"slot_number":3,"profile_name":"Profile 3","pin":"3003"},{"slot_number":4,"profile_name":"Profile 4","pin":"3004"}]'::jsonb,
   'active'),
  ('aa0e8400-e29b-41d4-a716-446655440104', '660e8400-e29b-41d4-a716-446655440003',
   'pool.1slot.demo@streamhub.app', 'Pool1Slot2026!', 4, 3,
   '[{"slot_number":1,"profile_name":"Profile 1","pin":"4001"},{"slot_number":2,"profile_name":"Profile 2","pin":"4002"},{"slot_number":3,"profile_name":"Profile 3","pin":"4003"},{"slot_number":4,"profile_name":"Profile 4","pin":"4004"}]'::jsonb,
   'active')
ON CONFLICT (id) DO NOTHING;
