'use client'

import DualChatInterface from '@/components/DualChatInterface'
import LanguageSelector from '@/components/LanguageSelector'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AgentPage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-xl hover:text-indigo-400 transition-colors">
            {t('siteName')}
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              {t('datasets')}
            </Link>
            <span className="text-indigo-400 font-medium">{t('aiAgent')}</span>
            <LanguageSelector />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('pageTitle')}
          </h1>
          <p className="text-gray-400">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Dual Chat Interface */}
        <DualChatInterface />

        {/* Info Cards */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Search Info */}
          <div className="bg-gray-900 rounded-lg p-4 border border-indigo-500/30">
            <h3 className="text-indigo-400 font-medium mb-3 flex items-center">
              <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
              {t('databaseSearch')}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('materialsProject')}</p>
                <p className="text-gray-400 text-xs">{t('mpDesc')}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('aflow')}</p>
                <p className="text-gray-400 text-xs">{t('aflowDesc')}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('oqmd')}</p>
                <p className="text-gray-400 text-xs">{t('oqmdDesc')}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('cod')}</p>
                <p className="text-gray-400 text-xs">{t('codDesc')}</p>
              </div>
            </div>
          </div>

          {/* Compute Info */}
          <div className="bg-gray-900 rounded-lg p-4 border border-emerald-500/30">
            <h3 className="text-emerald-400 font-medium mb-3 flex items-center">
              <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
              {t('computationTools')}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('structureAnalysis')}</p>
                <p className="text-gray-400 text-xs">{t('structureAnalysisDesc')}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('phaseDiagram')}</p>
                <p className="text-gray-400 text-xs">{t('phaseDiagramDesc')}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('formatConversion')}</p>
                <p className="text-gray-400 text-xs">{t('formatConversionDesc')}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-white font-medium">{t('elementInfo')}</p>
                <p className="text-gray-400 text-xs">{t('elementInfoDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
