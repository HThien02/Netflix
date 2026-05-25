import type { Product } from '@/lib/types'
import type { Lang } from '@/lib/translations'

type Localized = { vi: string; en: string }

const catalog: Record<
  string,
  { name: Localized; description: Localized; category?: Localized }
> = {
  'prod-1': {
    name: { vi: 'Premium Plus', en: 'Premium Plus' },
    description: {
      vi: 'Streaming 4K Ultra HD, nhiều màn hình đồng thời, tải xem offline',
      en: '4K Ultra HD streaming, multiple simultaneous screens, offline downloads',
    },
  },
  'prod-2': {
    name: { vi: 'Standard HD', en: 'Standard HD' },
    description: {
      vi: 'Streaming 1080p HD, 2 màn hình đồng thời',
      en: '1080p HD streaming, 2 simultaneous screens',
    },
  },
  'prod-3': {
    name: { vi: 'Basic', en: 'Basic' },
    description: {
      vi: 'Streaming 720p HD, một màn hình',
      en: '720p HD streaming, single screen',
    },
  },
  'prod-4': {
    name: { vi: 'Global Plus', en: 'Global Plus' },
    description: {
      vi: 'Truy cập hơn 10.000 phim và chương trình quốc tế',
      en: 'Access to 10,000+ international shows and movies',
    },
  },
  'prod-5': {
    name: { vi: 'Family Bundle', en: 'Family Bundle' },
    description: {
      vi: '6 hồ sơ, kiểm soát trẻ em, 4 màn hình đồng thời',
      en: '6 profiles, parental controls, 4 simultaneous screens',
    },
  },
}

const categoryLabels: Record<string, Localized> = {
  streaming: { vi: 'Streaming', en: 'Streaming' },
}

export function getLocalizedProduct(product: Product, lang: Lang) {
  const row = catalog[product.id]
  const l = lang === 'en' ? 'en' : 'vi'
  if (l === 'en' && product.nameEn) {
    return {
      name: product.nameEn,
      description: product.descriptionEn || product.description,
      category:
        row?.category?.[l] ??
        categoryLabels[product.category]?.[l] ??
        product.category,
    }
  }
  return {
    name: row?.name[l] ?? product.name,
    description: row?.description[l] ?? product.description,
    category:
      row?.category?.[l] ??
      categoryLabels[product.category]?.[l] ??
      product.category,
  }
}

export function getLocalizedProductName(productId: string, fallback: string, lang: Lang) {
  const row = catalog[productId]
  const l = lang === 'en' ? 'en' : 'vi'
  return row?.name[l] ?? fallback
}
