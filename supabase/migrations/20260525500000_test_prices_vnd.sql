-- Giá test PayOS (tối thiểu 10.000 VND theo PayOS)

UPDATE public.products SET price = 10000, updated_at = NOW();
UPDATE public.subscriptions SET price = 10000, updated_at = NOW();
