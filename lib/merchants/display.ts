import { t, type Lang } from '@/lib/translations'

const MERCHANT_I18N: Record<string, { nameKey: string; descKey: string }> = {
  'merchant-1': {
    nameKey: 'merchants.merchant1.name',
    descKey: 'merchants.merchant1.desc',
  },
  'merchant-2': {
    nameKey: 'merchants.merchant2.name',
    descKey: 'merchants.merchant2.desc',
  },
}

function translateOrFallback(key: string, language: Lang, fallback: string) {
  const value = t(key, language)
  return value === key ? fallback : value
}

export function getMerchantStoreName(
  merchantId: string,
  language: Lang,
  fallback: string,
) {
  const keys = MERCHANT_I18N[merchantId]
  if (!keys) return fallback
  return translateOrFallback(keys.nameKey, language, fallback)
}

export function getMerchantDescription(
  merchantId: string,
  language: Lang,
  fallback: string,
) {
  const keys = MERCHANT_I18N[merchantId]
  if (!keys) return fallback
  return translateOrFallback(keys.descKey, language, fallback)
}
