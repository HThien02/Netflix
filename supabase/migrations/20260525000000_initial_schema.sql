-- Netflix SaaS Platform - Initial schema + seed data
-- Run in Supabase Dashboard → SQL Editor (or: supabase db push)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'merchant', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  language VARCHAR(5) DEFAULT 'vi' CHECK (language IN ('vi', 'en')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_months INT DEFAULT 1,
  max_screens INT DEFAULT 1,
  quality VARCHAR(50),
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  rating DECIMAL(3, 1) DEFAULT 4.5,
  reviews_count INT DEFAULT 0,
  category VARCHAR(100),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merchant_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  verification_status VARCHAR(50) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  total_sales DECIMAL(12, 2) DEFAULT 0,
  rating DECIMAL(3, 1) DEFAULT 0,
  followers_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  reserved INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (merchant_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  status VARCHAR(50) DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  plan_type VARCHAR(50) DEFAULT 'monthly'
    CHECK (plan_type IN ('monthly', 'quarterly', 'annual')),
  price DECIMAL(10, 2),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50) DEFAULT 'payos',
  invoice_number VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_percent DECIMAL(5, 2),
  discount_fixed DECIMAL(10, 2),
  max_uses INT DEFAULT 100,
  current_uses INT DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(100),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vip_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  level INT NOT NULL UNIQUE,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  features TEXT[],
  minimum_spending DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_vip_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.vip_tiers(id) ON DELETE RESTRICT,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'products', 'merchant_stores', 'inventory',
    'subscriptions', 'invoices', 'coupons', 'support_tickets', 'user_vip_status'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;
      CREATE TRIGGER trg_%s_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Row Level Security (permissive for demo; tighten in production)
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vip_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_products" ON public.products FOR SELECT USING (true);
CREATE POLICY "public_read_coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_vip_tiers" ON public.vip_tiers FOR SELECT USING (true);
CREATE POLICY "public_read_users_login" ON public.users FOR SELECT USING (true);
CREATE POLICY "public_read_merchant_stores" ON public.merchant_stores FOR SELECT USING (true);
CREATE POLICY "public_read_inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "public_read_subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "public_read_invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "public_read_support_tickets" ON public.support_tickets FOR SELECT USING (true);
CREATE POLICY "public_read_user_vip" ON public.user_vip_status FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Seed data (idempotent)
-- ---------------------------------------------------------------------------

-- Password for all demo users: demo123
-- Hash: bcrypt 10 rounds

INSERT INTO public.users (id, email, password_hash, role, full_name, phone, language) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'customer1@example.com', '$2b$10$SOSyrNgW0DpXQtGvTvByGebDxuI0P8Ze0cFlD9NML3wG/UYm4WbFy', 'customer', 'Nguyễn Văn A', '0912345678', 'vi'),
  ('550e8400-e29b-41d4-a716-446655440002', 'customer2@example.com', '$2b$10$SOSyrNgW0DpXQtGvTvByGebDxuI0P8Ze0cFlD9NML3wG/UYm4WbFy', 'customer', 'Trần Thị B', '0923456789', 'vi'),
  ('550e8400-e29b-41d4-a716-446655440003', 'customer3@example.com', '$2b$10$SOSyrNgW0DpXQtGvTvByGebDxuI0P8Ze0cFlD9NML3wG/UYm4WbFy', 'customer', 'Phạm Văn C', '0934567890', 'vi'),
  ('550e8400-e29b-41d4-a716-446655440004', 'merchant1@example.com', '$2b$10$SOSyrNgW0DpXQtGvTvByGebDxuI0P8Ze0cFlD9NML3wG/UYm4WbFy', 'merchant', 'Hoàng Thị D', '0945678901', 'vi'),
  ('550e8400-e29b-41d4-a716-446655440005', 'merchant2@example.com', '$2b$10$SOSyrNgW0DpXQtGvTvByGebDxuI0P8Ze0cFlD9NML3wG/UYm4WbFy', 'merchant', 'Bùi Văn E', '0956789012', 'vi'),
  ('550e8400-e29b-41d4-a716-446655440006', 'admin@example.com', '$2b$10$SOSyrNgW0DpXQtGvTvByGebDxuI0P8Ze0cFlD9NML3wG/UYm4WbFy', 'admin', 'Lê Quốc F', '0967890123', 'vi')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.products (id, name, description, price, duration_months, max_screens, quality, category, rating, reviews_count) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Netflix Basic', '480p, 1 screen', 1000, 1, 1, '480p', 'Streaming', 4.2, 1200),
  ('660e8400-e29b-41d4-a716-446655440002', 'Netflix Standard', '1080p, 2 screens', 1000, 1, 2, '1080p', 'Streaming', 4.5, 2400),
  ('660e8400-e29b-41d4-a716-446655440003', 'Netflix Premium', '4K HDR, 4 screens', 1000, 1, 4, '4K', 'Streaming', 4.7, 3100),
  ('660e8400-e29b-41d4-a716-446655440004', 'Amazon Prime Video', 'Movies, series & shipping perks', 1000, 1, 3, '1080p', 'Streaming', 4.4, 890),
  ('660e8400-e29b-41d4-a716-446655440005', 'Disney+', 'Marvel, Star Wars, Pixar', 1000, 1, 4, '4K', 'Streaming', 4.6, 1500),
  ('660e8400-e29b-41d4-a716-446655440006', 'HBO Max', 'Premium HBO originals', 1000, 1, 3, '4K', 'Streaming', 4.5, 980),
  ('660e8400-e29b-41d4-a716-446655440007', 'Spotify Premium', 'Ad-free music', 1000, 1, 1, 'High', 'Music', 4.8, 5200),
  ('660e8400-e29b-41d4-a716-446655440008', 'YouTube Premium', 'No ads + background play', 1000, 1, 1, '1080p', 'Music', 4.3, 2100),
  ('660e8400-e29b-41d4-a716-446655440009', 'Hulu', 'TV shows & movies', 1000, 1, 2, '1080p', 'Streaming', 4.1, 760),
  ('660e8400-e29b-41d4-a716-446655440010', 'Paramount+', 'CBS, Nickelodeon & more', 1000, 1, 3, '1080p', 'Streaming', 4.0, 540)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.merchant_stores (id, user_id, store_name, description, verification_status, total_sales, rating, followers_count) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'StreamHub Vietnam', 'Gói streaming chính hãng', 'verified', 125000, 4.8, 1200),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Global Media Store', 'Dịch vụ quốc tế 24/7', 'verified', 89000, 4.6, 850)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory (id, merchant_id, product_id, quantity, reserved) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 50, 5),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 30, 2),
  ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440007', 100, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vip_tiers (id, name, level, discount_percent, features, minimum_spending) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Silver', 1, 5, ARRAY['Basic support', '1 month free/year'], 500),
  ('990e8400-e29b-41d4-a716-446655440002', 'Gold', 2, 10, ARRAY['VIP support', '3 months free/year'], 2000),
  ('990e8400-e29b-41d4-a716-446655440003', 'Platinum', 3, 20, ARRAY['Personal manager', '6 months free/year'], 5000)
ON CONFLICT (level) DO NOTHING;

INSERT INTO public.coupons (id, code, description, discount_percent, max_uses, current_uses, expiry_date, is_active) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 'WELCOME10', '10% off first order', 10, 1000, 42, NOW() + INTERVAL '30 days', true),
  ('aa0e8400-e29b-41d4-a716-446655440002', 'SUMMER20', 'Summer sale 20%', 20, 500, 18, NOW() + INTERVAL '60 days', true),
  ('aa0e8400-e29b-41d4-a716-446655440003', 'VIP15', 'VIP members 15%', 15, 100, 5, NOW() + INTERVAL '90 days', true),
  ('aa0e8400-e29b-41d4-a716-446655440004', 'NEWYEAR25', 'New year 25%', 25, 200, 12, NOW() + INTERVAL '45 days', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.subscriptions (id, user_id, product_id, status, plan_type, price, start_date, end_date, auto_renew) VALUES
  ('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'active', 'monthly', 1000, NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', true),
  ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', 'active', 'monthly', 1000, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', true),
  ('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 'cancelled', 'annual', 1000, NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days', false),
  ('bb0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'active', 'quarterly', 1000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoices (id, user_id, subscription_id, total_amount, tax_amount, discount_amount, final_amount, status, payment_method, invoice_number) VALUES
  ('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 22.99, 2.30, 0, 25.29, 'completed', 'payos', 'INV-2026-001'),
  ('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440002', 9.99, 1.00, 0, 10.99, 'completed', 'payos', 'INV-2026-002'),
  ('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440003', 10.99, 1.10, 1.10, 10.99, 'completed', 'card', 'INV-2026-003'),
  ('cc0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440004', 15.49, 1.55, 0, 17.04, 'pending', 'wallet', 'INV-2026-004')
ON CONFLICT (invoice_number) DO NOTHING;

INSERT INTO public.support_tickets (id, user_id, subject, description, status, priority, category) VALUES
  ('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Cannot renew Netflix Premium', 'Payment failed twice', 'open', 'high', 'billing'),
  ('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Spotify login issue', 'Account not activated', 'in_progress', 'medium', 'technical'),
  ('dd0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Refund request', 'Cancelled Disney+ annual', 'resolved', 'low', 'billing')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_vip_status (id, user_id, tier_id, total_spent) VALUES
  ('ee0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', 2500),
  ('ee0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 600)
ON CONFLICT (user_id) DO NOTHING;
