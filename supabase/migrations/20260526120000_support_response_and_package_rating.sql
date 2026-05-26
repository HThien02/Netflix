-- Phản hồi admin trên ticket + đánh giá gói đã mua
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS admin_response TEXT,
  ADD COLUMN IF NOT EXISTS admin_responded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.support_tickets.admin_response IS 'Nội dung phản hồi từ admin';
COMMENT ON COLUMN public.support_tickets.admin_responded_at IS 'Thời điểm admin phản hồi';

ALTER TABLE public.purchased_accounts
  ADD COLUMN IF NOT EXISTS user_rating SMALLINT CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)),
  ADD COLUMN IF NOT EXISTS user_review TEXT,
  ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.purchased_accounts.user_rating IS 'Đánh giá 1-5 sao từ khách hàng';
