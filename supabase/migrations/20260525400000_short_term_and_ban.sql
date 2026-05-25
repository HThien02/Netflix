-- Gói ngắn hạn (plan_type mở rộng) + lý do ban + theo dõi ban

CREATE TABLE IF NOT EXISTS public.ban_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchased_accounts
  ADD COLUMN IF NOT EXISTS ban_reason_id UUID REFERENCES public.ban_reasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ban_admin_note TEXT;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_type_check CHECK (
    plan_type IN ('daily_1', 'daily_3', 'daily_7', 'monthly', 'quarterly', 'annual')
  );

DROP TRIGGER IF EXISTS trg_ban_reasons_updated_at ON public.ban_reasons;
CREATE TRIGGER trg_ban_reasons_updated_at
  BEFORE UPDATE ON public.ban_reasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ban_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_ban_reasons" ON public.ban_reasons FOR SELECT USING (true);
CREATE POLICY "public_all_ban_reasons" ON public.ban_reasons FOR ALL USING (true);

INSERT INTO public.ban_reasons (code, title_vi, title_en, description_vi, description_en, sort_order) VALUES
  ('payment_fraud', 'Gian lận thanh toán', 'Payment fraud',
   'Phát hiện giao dịch hoặc thanh toán không hợp lệ.', 'Invalid or fraudulent payment detected.', 1),
  ('terms_violation', 'Vi phạm điều khoản', 'Terms violation',
   'Sử dụng dịch vụ trái với điều khoản đã đồng ý.', 'Service used in violation of agreed terms.', 2),
  ('account_sharing', 'Chia sẻ tài khoản', 'Unauthorized sharing',
   'Chia sẻ thông tin đăng nhập cho bên thứ ba.', 'Credentials shared with unauthorized parties.', 3),
  ('suspicious_activity', 'Hoạt động bất thường', 'Suspicious activity',
   'Hành vi đăng nhập hoặc sử dụng bất thường.', 'Unusual login or usage patterns.', 4),
  ('policy_abuse', 'Lạm dụng chính sách', 'Policy abuse',
   'Lạm dụng ưu đãi, hoàn tiền hoặc chính sách dịch vụ.', 'Abuse of promotions, refunds, or policies.', 5),
  ('admin_review', 'Kiểm tra nội bộ', 'Internal review',
   'Tạm khóa trong quá trình xác minh.', 'Temporarily suspended pending verification.', 6),
  ('other', 'Lý do khác', 'Other',
   'Quản trị viên sẽ ghi chú cụ thể bên dưới.', 'Admin will provide details in the note.', 99)
ON CONFLICT (code) DO NOTHING;
