'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export interface SynthesisRecipe {
  id: string
  doi: string
  target_formula: string
  target_name: string
  precursors: { formula: string; name: string }[]
  temperature_min: number | null
  temperature_max: number | null
  time_min: number | null
  time_max: number | null
  atmosphere: string | null
  operations: string[]
  synthesis_type: 'solid-state' | 'sol-gel'
}

interface SynthesisCardProps {
  recipe: SynthesisRecipe
}

export function SynthesisCard({ recipe }: SynthesisCardProps) {
  const { t } = useLanguage()

  const formatTemp = () => {
    if (recipe.temperature_min === null && recipe.temperature_max === null) return null
    if (recipe.temperature_min === recipe.temperature_max) return `${recipe.temperature_min}°C`
    return `${recipe.temperature_min ?? '?'}-${recipe.temperature_max ?? '?'}°C`
  }

  const formatTime = () => {
    if (recipe.time_min === null && recipe.time_max === null) return null
    if (recipe.time_min === recipe.time_max) return `${recipe.time_min}h`
    return `${recipe.time_min ?? '?'}-${recipe.time_max ?? '?'}h`
  }

  const temp = formatTemp()
  const time = formatTime()

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-gray-900">{recipe.target_formula}</h3>
        <span className={`text-xs px-2 py-1 rounded font-medium ${
          recipe.synthesis_type === 'solid-state'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {recipe.synthesis_type}
        </span>
      </div>

      {recipe.target_name && (
        <p className="text-sm text-gray-500 mb-3">{recipe.target_name}</p>
      )}

      <div className="space-y-3 text-sm">
        {/* Precursors */}
        <div>
          <span className="font-medium text-gray-700">📦 {t('precursors')}:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {recipe.precursors.map((p, i) => (
              <span
                key={i}
                className="bg-gray-100 px-2 py-0.5 rounded text-gray-700"
                title={p.name}
              >
                {p.formula}
              </span>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="flex flex-wrap gap-3 text-gray-600">
          {temp && (
            <span className="flex items-center gap-1">
              🔥 {temp}
            </span>
          )}
          {time && (
            <span className="flex items-center gap-1">
              ⏱️ {time}
            </span>
          )}
          {recipe.atmosphere && (
            <span className="flex items-center gap-1">
              💨 {recipe.atmosphere}
            </span>
          )}
        </div>

        {/* Operations */}
        {recipe.operations.length > 0 && (
          <div className="text-gray-500">
            <span className="font-medium">⚙️</span>{' '}
            {recipe.operations.join(' → ')}
          </div>
        )}
      </div>

      {/* DOI Link */}
      <a
        href={`https://doi.org/${recipe.doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-blue-600 hover:text-blue-800 text-xs block"
      >
        📄 DOI: {recipe.doi} →
      </a>
    </div>
  )
}
