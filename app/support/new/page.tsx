'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { motion } from 'framer-motion'
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react'
import {
  SUPPORT_MAX_FILES,
  validateSupportImageFiles,
  isAllowedSupportImage,
} from '@/lib/support/attachments'
import { validateClient } from '@/lib/validation/client'
import { createSupportTicketSchema } from '@/lib/validation/support'

type Preview = { file: File; url: string }

export default function NewSupportTicketPage() {
  const router = useRouter()
  const { language } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [previews, setPreviews] = useState<Preview[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    setError('')

    const next = [...previews]
    for (const file of Array.from(list)) {
      if (next.length >= SUPPORT_MAX_FILES) break
      if (!isAllowedSupportImage(file)) {
        setError(t('support.imagesInvalid', language))
        continue
      }
      next.push({ file, url: URL.createObjectURL(file) })
    }

    const err = validateSupportImageFiles(next.map((p) => p.file))
    if (err) {
      setError(err)
      return
    }
    setPreviews(next)
  }

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const copy = [...prev]
      URL.revokeObjectURL(copy[index].url)
      copy.splice(index, 1)
      return copy
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const valid = validateClient(
      createSupportTicketSchema,
      { subject, description },
      language,
    )
    if (!valid.success) {
      setError(valid.error)
      return
    }

    const fileErr = validateSupportImageFiles(previews.map((p) => p.file))
    if (fileErr) {
      setError(fileErr)
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('subject', valid.data.subject)
      formData.append('description', valid.data.description)
      for (const p of previews) {
        formData.append('images', p.file)
      }

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || t('support.createFailed', language))
      }

      router.push('/support/tickets')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('support.createFailed', language))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            href="/support/tickets"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft size={18} />
            {t('support.backTickets', language)}
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white mb-2">{t('support.newTitle', language)}</h1>
            <p className="text-gray-400 mb-8">{t('support.newSubtitle', language)}</p>

            <form onSubmit={handleSubmit} className="glass-dark rounded-2xl p-6 border border-white/10 space-y-6">
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('support.subject', language)}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  placeholder={t('support.subjectPlaceholder', language)}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-netflix-red"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('support.description', language)}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  placeholder={t('support.descriptionPlaceholder', language)}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-netflix-red resize-y min-h-[140px]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t('support.attachments', language)} ({previews.length}/{SUPPORT_MAX_FILES})
                </label>
                <p className="text-xs text-gray-500 mb-3">{t('support.attachmentsHint', language)}</p>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={previews.length >= SUPPORT_MAX_FILES}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/20 text-gray-300 hover:border-netflix-red hover:text-white transition-colors disabled:opacity-40"
                >
                  <ImagePlus size={20} />
                  {t('support.addImages', language)}
                </button>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {previews.map((p, i) => (
                      <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                        <Image src={p.url} alt="" fill className="object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => removePreview(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-netflix-red"
                          aria-label="Remove"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary-red py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {t('support.submitting', language)}
                  </>
                ) : (
                  t('support.submit', language)
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </AppLayout>
  )
}
