'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { SynthesisCard, SynthesisRecipe } from '@/components/SynthesisCard'
import {
  synthesisRecipes,
  searchByFormula,
  searchByPrecursor,
  searchByTemperature
} from '@/data/synthesis-recipes'

type SearchMode = 'formula' | 'precursor' | 'temperature'
type SynthesisType = 'all' | 'solid-state' | 'sol-gel'

export default function SynthesisPage() {
  const { t } = useLanguage()
  const [searchMode, setSearchMode] = useState<SearchMode>('formula')
  const [query, setQuery] = useState('')
  const [minTemp, setMinTemp] = useState(300)
  const [maxTemp, setMaxTemp] = useState(1200)
  const [synthType, setSynthType] = useState<SynthesisType>('all')

  const filteredRecipes = useMemo(() => {
    let results: SynthesisRecipe[] = []

    if (searchMode === 'formula' && query) {
      results = searchByFormula(query, 50)
    } else if (searchMode === 'precursor' && query) {
      results = searchByPrecursor(query, 50)
    } else if (searchMode === 'temperature') {
      results = searchByTemperature(minTemp, maxTemp, 50)
    } else {
      results = synthesisRecipes
    }

    // Filter by synthesis type
    if (synthType !== 'all') {
      results = results.filter(r => r.synthesis_type === synthType)
    }

    return results
  }, [searchMode, query, minTemp, maxTemp, synthType])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">🧪 {t('synthesis')}</h1>
          <p className="text-purple-100">{t('synthesisDesc')}</p>
          <p className="text-sm text-purple-200 mt-2">
            Based on Ceder Group Text-Mined Synthesis Dataset
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchMode('formula')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                searchMode === 'formula'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔬 {t('searchFormula')}
            </button>
            <button
              onClick={() => setSearchMode('precursor')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                searchMode === 'precursor'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 {t('searchPrecursor')}
            </button>
            <button
              onClick={() => setSearchMode('temperature')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                searchMode === 'temperature'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔥 {t('temperature')}
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-4 items-end">
            {searchMode !== 'temperature' ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchMode === 'formula'
                      ? 'LiCoO2, BaTiO3, LiFePO4...'
                      : 'Li2CO3, TiO2, Fe2O3...'
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div className="flex-1 flex gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Min (°C)</label>
                  <input
                    type="number"
                    value={minTemp}
                    onChange={(e) => setMinTemp(Number(e.target.value))}
                    className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max (°C)</label>
                  <input
                    type="number"
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(Number(e.target.value))}
                    className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Synthesis Type Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <select
                value={synthType}
                onChange={(e) => setSynthType(e.target.value as SynthesisType)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">{t('allTypes')}</option>
                <option value="solid-state">{t('solidState')}</option>
                <option value="sol-gel">{t('solGel')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          {filteredRecipes.length} {t('foundRecipes')}
        </div>

        {/* Results Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <SynthesisCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p>{t('noResults')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
