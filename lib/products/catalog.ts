import type { Product } from '@/lib/types'

const IMG = {
  netflix:
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&h=500&fit=crop',
  disney:
    'https://images.unsplash.com/photo-1626819375164-7a7e9a11ef4f?w=800&h=500&fit=crop',
  hbo: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=500&fit=crop',
  prime:
    'https://images.unsplash.com/photo-1522869635100-ce306256633a?w=800&h=500&fit=crop',
  spotify:
    'https://images.unsplash.com/photo-1614680436575-04978d250ed8?w=800&h=500&fit=crop',
  youtube:
    'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=500&fit=crop',
  apple:
    'https://images.unsplash.com/photo-1538481199705-c710c4e170b7?w=800&h=500&fit=crop',
  vieon:
    'https://images.unsplash.com/photo-1598899134739-06060bdeb127?w=800&h=500&fit=crop',
}

/** UUID cố định — trùng Supabase seed & pool test */
export const PAYOS_TEST_PRODUCT_ID = '660e8400-e29b-41d4-a716-446655440003'

/**
 * Marketplace catalog — chỉ 1 gói mua được (10.000đ test PayOS), còn lại Coming soon.
 */
export const PRODUCT_CATALOG: Product[] = [
  {
    id: PAYOS_TEST_PRODUCT_ID,
    merchantId: 'merchant-1',
    name: 'Netflix Premium',
    nameEn: 'Netflix Premium',
    description:
      'Gói Netflix Premium chính chủ: 4K HDR, tối đa 4 thiết bị đồng thời, tải xuống offline. Hỗ trợ thuê slot 1–4 profile hoặc gói ngắn 1/3/7 ngày. Giá 10.000đ dùng để test thanh toán PayOS.',
    descriptionEn:
      'Official-style Netflix Premium: 4K HDR, up to 4 devices, offline downloads. Rent 1–4 profiles or short 1/3/7-day plans. Priced at 10,000 VND for PayOS payment testing.',
    image: IMG.netflix,
    category: 'streaming',
    basePrice: 10_000,
    discountPercentage: undefined,
    active: true,
    comingSoon: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    merchantId: 'merchant-1',
    name: 'Netflix Standard',
    nameEn: 'Netflix Standard',
    description:
      'Full HD 1080p, 2 màn hình cùng lúc, tải phim trên 2 thiết bị. Phù hợp cặp đôi hoặc roommate. Gói dài hạn: thuê theo tháng/quý/năm, hết hạn đúng ngày trong tháng.',
    descriptionEn:
      '1080p Full HD, 2 simultaneous screens, downloads on 2 devices. Long-term monthly/quarterly/yearly rental with calendar-day renewal.',
    image: IMG.netflix,
    category: 'streaming',
    basePrice: 149_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    merchantId: 'merchant-1',
    name: 'Netflix Basic',
    nameEn: 'Netflix Basic',
    description:
      'HD 720p, 1 thiết bị, không quảng cáo. Gói tiết kiệm cho người xem một mình. Sắp mở bán — đang hoàn thiện kho slot.',
    descriptionEn:
      '720p HD, 1 device, ad-free. Budget tier for solo viewers. Opening soon — slot inventory in progress.',
    image: IMG.netflix,
    category: 'streaming',
    basePrice: 89_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440005',
    merchantId: 'merchant-1',
    name: 'Disney+',
    nameEn: 'Disney+',
    description:
      'Marvel, Star Wars, Pixar, National Geographic — 4K trên gói Cao cấp, tối đa 4 profile. Gói ngắn và dài hạn tương tự NetflixHub.',
    descriptionEn:
      'Marvel, Star Wars, Pixar, Nat Geo — 4K on Premium, up to 4 profiles. Short and long-term plans like other services.',
    image: IMG.disney,
    category: 'streaming',
    basePrice: 99_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440006',
    merchantId: 'merchant-2',
    name: 'Max (HBO)',
    nameEn: 'Max (HBO)',
    description:
      'Phim HBO, Warner Bros, DC — chất lượng 4K, nội dung người lớn có kiểm soát profile. Đang tích hợp thanh toán.',
    descriptionEn:
      'HBO originals, Warner, DC — 4K where available. Mature content with profile controls. Payment integration coming soon.',
    image: IMG.hbo,
    category: 'streaming',
    basePrice: 120_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    merchantId: 'merchant-2',
    name: 'Amazon Prime Video',
    nameEn: 'Amazon Prime Video',
    description:
      'Phim, series độc quyền Prime, X-Ray, nhiều kênh add-on. Thuê account Prime Video (không gồm ship Prime toàn cầu).',
    descriptionEn:
      'Movies, Prime originals, X-Ray. Prime Video account rental (shipping perks not included).',
    image: IMG.prime,
    category: 'streaming',
    basePrice: 79_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440007',
    merchantId: 'merchant-2',
    name: 'Spotify Premium',
    nameEn: 'Spotify Premium',
    description:
      'Nghe nhạc không quảng cáo, tải offline, chất lượng cao. Một slot / một tài khoản — gói 1/3/7 ngày hoặc theo tháng.',
    descriptionEn:
      'Ad-free music, offline listening, high quality. One account per slot — daily or monthly plans.',
    image: IMG.spotify,
    category: 'music',
    basePrice: 59_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440008',
    merchantId: 'merchant-2',
    name: 'YouTube Premium',
    nameEn: 'YouTube Premium',
    description:
      'Không quảng cáo, phát nền, YouTube Music Premium đi kèm. Phù hợp creator và người xem nhiều.',
    descriptionEn:
      'Ad-free YouTube, background play, includes YouTube Music Premium.',
    image: IMG.youtube,
    category: 'music',
    basePrice: 69_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440009',
    merchantId: 'merchant-1',
    name: 'Apple TV+',
    nameEn: 'Apple TV+',
    description:
      'Series & phim Apple Originals 4K Dolby Vision. Ít profile hơn Netflix — thường chia sẻ 1–2 người/family.',
    descriptionEn:
      'Apple Originals in 4K Dolby Vision. Typically 1–2 users per family group.',
    image: IMG.apple,
    category: 'streaming',
    basePrice: 49_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2025-05-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440010',
    merchantId: 'merchant-1',
    name: 'VieON VIP',
    nameEn: 'VieON VIP',
    description:
      'Phim Việt, show truyền hình, HBO GO/VieON Original — ưu tiên nội dung local. Gói VIP không quảng cáo.',
    descriptionEn:
      'Vietnamese films, TV shows, local originals — VIP ad-free tier.',
    image: IMG.vieon,
    category: 'streaming',
    basePrice: 39_000,
    active: true,
    comingSoon: true,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2025-05-01'),
  },
]

export function isProductPurchasable(product: Product): boolean {
  return product.active && !product.comingSoon
}
