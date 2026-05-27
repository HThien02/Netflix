'use client'

import { useApp } from '@/lib/context'

export function AuthLanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useApp()

  return (
    <div
      className={`inline-flex rounded-lg border border-white/15 bg-black/40 p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`px-3 py-1.5 rounded-md transition-colors ${
          language === 'vi' ? 'bg-netflix-red text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md transition-colors ${
          language === 'en' ? 'bg-netflix-red text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}
