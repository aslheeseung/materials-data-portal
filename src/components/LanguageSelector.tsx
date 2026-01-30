'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Language } from '@/lib/i18n'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setLanguage('ko')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'ko'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}
