'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Trash2 } from 'lucide-react'
import { t, type Lang } from '@/lib/translations'

type Props = {
  language: Lang
  previewUrl: string | null
  onFileSelect: (file: File | null) => void
  onRemoveExisting?: () => void
  disabled?: boolean
}

const ACCEPT = 'image/jpeg,image/png,image/webp'

export function ProductImageField({
  language,
  previewUrl,
  onFileSelect,
  onRemoveExisting,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const displayUrl = localPreview || previewUrl

  const pickFile = (file: File | null) => {
    if (localPreview) URL.revokeObjectURL(localPreview)
    if (!file) {
      setLocalPreview(null)
      onFileSelect(null)
      return
    }
    setLocalPreview(URL.createObjectURL(file))
    onFileSelect(file)
  }

  return (
    <div className="md:col-span-2 space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {t('admin.productImageUpload', language)}
      </label>
      <p className="text-xs text-gray-500">{t('admin.productImageHint', language)}</p>

      {displayUrl ? (
        <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40">
          <Image src={displayUrl} alt="" fill className="object-cover" sizes="320px" unoptimized />
        </div>
      ) : (
        <div className="w-full max-w-xs aspect-video rounded-xl border border-dashed border-white/20 bg-black/30 flex items-center justify-center text-gray-500 text-sm">
          {t('admin.productImageEmpty', language)}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15 disabled:opacity-50"
        >
          <ImagePlus size={16} />
          {t('admin.productImageChoose', language)}
        </button>
        {(displayUrl || previewUrl) && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              pickFile(null)
              if (inputRef.current) inputRef.current.value = ''
              onRemoveExisting?.()
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {t('admin.productImageRemove', language)}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
