-- Coming soon + nội dung sản phẩm; chỉ Netflix Premium test PayOS 10.000đ
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_en TEXT;

UPDATE public.products SET
  coming_soon = true,
  price = 89000,
  name = 'Netflix Basic',
  name_en = 'Netflix Basic',
  description = 'HD 720p, 1 thiết bị, không quảng cáo. Gói tiết kiệm — sắp mở bán.',
  description_en = '720p HD, 1 device — opening soon.',
  quality = '720p',
  max_screens = 1,
  category = 'Streaming',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440001';

UPDATE public.products SET
  coming_soon = true,
  price = 149000,
  name = 'Netflix Standard',
  name_en = 'Netflix Standard',
  description = 'Full HD 1080p, 2 màn hình, tải offline 2 thiết bị — Coming soon.',
  description_en = '1080p, 2 screens — Coming soon.',
  quality = '1080p',
  max_screens = 2,
  category = 'Streaming',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440002';

UPDATE public.products SET
  coming_soon = false,
  price = 10000,
  name = 'Netflix Premium',
  name_en = 'Netflix Premium',
  description = '4K HDR, 4 thiết bị, offline. Giá 10.000đ test PayOS. Thuê slot 1–4 hoặc gói 1/3/7 ngày.',
  description_en = '4K HDR, 4 devices. 10,000 VND PayOS test price.',
  quality = '4K',
  max_screens = 4,
  category = 'Streaming',
  discount_percent = 0,
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440003';

UPDATE public.products SET
  coming_soon = true,
  price = 79000,
  name = 'Amazon Prime Video',
  name_en = 'Amazon Prime Video',
  description = 'Phim & series Prime, X-Ray — Coming soon.',
  description_en = 'Prime Video originals — Coming soon.',
  quality = '1080p',
  max_screens = 3,
  category = 'Streaming',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440004';

UPDATE public.products SET
  coming_soon = true,
  price = 99000,
  name = 'Disney+',
  name_en = 'Disney+',
  description = 'Marvel, Star Wars, Pixar 4K — Coming soon.',
  description_en = 'Disney+ Premium — Coming soon.',
  quality = '4K',
  max_screens = 4,
  category = 'Streaming',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440005';

UPDATE public.products SET
  coming_soon = true,
  price = 120000,
  name = 'Max (HBO)',
  name_en = 'Max (HBO)',
  description = 'HBO Originals, Warner, DC — Coming soon.',
  description_en = 'Max streaming — Coming soon.',
  quality = '4K',
  max_screens = 3,
  category = 'Streaming',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440006';

UPDATE public.products SET
  coming_soon = true,
  price = 59000,
  name = 'Spotify Premium',
  name_en = 'Spotify Premium',
  description = 'Nhạc không quảng cáo, offline — Coming soon.',
  description_en = 'Spotify Premium — Coming soon.',
  quality = 'High',
  max_screens = 1,
  category = 'Music',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440007';

UPDATE public.products SET
  coming_soon = true,
  price = 69000,
  name = 'YouTube Premium',
  name_en = 'YouTube Premium',
  description = 'Không quảng cáo, phát nền, YouTube Music — Coming soon.',
  description_en = 'YouTube Premium — Coming soon.',
  quality = '1080p',
  max_screens = 1,
  category = 'Music',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440008';

UPDATE public.products SET
  coming_soon = true,
  price = 49000,
  name = 'Apple TV+',
  name_en = 'Apple TV+',
  description = 'Apple Originals 4K — Coming soon.',
  description_en = 'Apple TV+ — Coming soon.',
  quality = '4K',
  max_screens = 2,
  category = 'Streaming',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440009';

UPDATE public.products SET
  coming_soon = true,
  price = 39000,
  name = 'VieON VIP',
  name_en = 'VieON VIP',
  description = 'Phim Việt, show local, VIP không quảng cáo — Coming soon.',
  description_en = 'VieON VIP — Coming soon.',
  quality = '1080p',
  max_screens = 2,
  category = 'Streaming',
  updated_at = NOW()
WHERE id = '660e8400-e29b-41d4-a716-446655440010';
