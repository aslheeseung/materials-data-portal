import { NextRequest, NextResponse } from 'next/server'
import {
  synthesisRecipes,
  searchByFormula,
  searchByPrecursor,
  searchByTemperature,
} from '@/data/synthesis-recipes'
import { SynthesisRecipe } from '@/components/SynthesisCard'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: Message[]
  language: string
}

function formatRecipe(recipe: SynthesisRecipe, index: number): string {
  const tempStr = recipe.temperature_min !== null || recipe.temperature_max !== null
    ? `${recipe.temperature_min ?? '?'}-${recipe.temperature_max ?? '?'}°C`
    : 'N/A'

  const timeStr = recipe.time_min !== null || recipe.time_max !== null
    ? `${recipe.time_min ?? '?'}-${recipe.time_max ?? '?'}h`
    : 'N/A'

  return `**${index + 1}. ${recipe.target_formula}** (${recipe.synthesis_type})
DOI: [${recipe.doi}](https://doi.org/${recipe.doi})
- Precursors: ${recipe.precursors.map(p => p.formula).join(', ')}
- Temperature: ${tempStr}
- Time: ${timeStr}
- Atmosphere: ${recipe.atmosphere || 'N/A'}
- Operations: ${recipe.operations.join(' → ') || 'N/A'}`
}

function parseQuery(query: string): {
  type: 'formula' | 'precursor' | 'temperature' | 'general'
  value: string
  minTemp?: number
  maxTemp?: number
} {
  const lowerQuery = query.toLowerCase()

  // Temperature range detection
  const tempMatch = query.match(/(\d+)\s*[-~]\s*(\d+)\s*°?C/i) ||
                   query.match(/(\d+)\s*도?\s*[-~에서부터]\s*(\d+)\s*도?/)
  if (tempMatch || lowerQuery.includes('temperature') || lowerQuery.includes('온도')) {
    const minTemp = tempMatch ? parseInt(tempMatch[1]) : 300
    const maxTemp = tempMatch ? parseInt(tempMatch[2]) : 1200
    return { type: 'temperature', value: query, minTemp, maxTemp }
  }

  // Precursor detection
  if (lowerQuery.includes('precursor') || lowerQuery.includes('전구체') ||
      lowerQuery.includes('using') || lowerQuery.includes('사용')) {
    // Extract formula from query
    const formulaMatch = query.match(/([A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)*(?:\([A-Z][a-z]?\d*\)\d*)?)/g)
    return { type: 'precursor', value: formulaMatch?.[0] || query }
  }

  // Formula detection (default)
  const formulaMatch = query.match(/([A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)+)/g)
  if (formulaMatch) {
    return { type: 'formula', value: formulaMatch[0] }
  }

  return { type: 'general', value: query }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { messages, language } = body

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const query = lastMessage.content.trim()
    const isKorean = language === 'ko'

    // Parse the query
    const parsed = parseQuery(query)
    let results: SynthesisRecipe[] = []
    let searchDescription = ''

    switch (parsed.type) {
      case 'formula':
        results = searchByFormula(parsed.value, 10)
        searchDescription = isKorean
          ? `"${parsed.value}" 재료의 합성 레시피`
          : `Synthesis recipes for "${parsed.value}"`
        break

      case 'precursor':
        results = searchByPrecursor(parsed.value, 10)
        searchDescription = isKorean
          ? `"${parsed.value}" 전구체를 사용하는 합성`
          : `Syntheses using "${parsed.value}" as precursor`
        break

      case 'temperature':
        results = searchByTemperature(parsed.minTemp || 300, parsed.maxTemp || 1200, 10)
        searchDescription = isKorean
          ? `${parsed.minTemp}-${parsed.maxTemp}°C 온도 범위 합성`
          : `Synthesis at ${parsed.minTemp}-${parsed.maxTemp}°C`
        break

      default:
        // General search - try formula first
        results = searchByFormula(query, 10)
        if (results.length === 0) {
          results = searchByPrecursor(query, 10)
        }
        searchDescription = isKorean
          ? `"${query}" 검색 결과`
          : `Search results for "${query}"`
    }

    // Format response
    if (results.length === 0) {
      const noResultsMessage = isKorean
        ? `"${query}"에 대한 합성 레시피를 찾을 수 없습니다.\n\n다른 검색어를 시도해보세요:\n- 재료명: LiCoO2, BaTiO3\n- 전구체: Li2CO3, TiO2\n- 온도 범위: 800-1000°C`
        : `No synthesis recipes found for "${query}".\n\nTry other searches:\n- Material: LiCoO2, BaTiO3\n- Precursor: Li2CO3, TiO2\n- Temperature: 800-1000°C`

      return NextResponse.json({ message: noResultsMessage })
    }

    const header = isKorean
      ? `**${searchDescription}**\n${results.length}개의 레시피 발견 (총 ${synthesisRecipes.length}개 중)\n`
      : `**${searchDescription}**\nFound ${results.length} recipes (out of ${synthesisRecipes.length} total)\n`

    const formattedRecipes = results.map((r, i) => formatRecipe(r, i)).join('\n\n')

    const footer = isKorean
      ? `\n---\n*출처: Ceder Group Text-Mined Synthesis Dataset*`
      : `\n---\n*Source: Ceder Group Text-Mined Synthesis Dataset*`

    return NextResponse.json({
      message: header + '\n' + formattedRecipes + footer
    })

  } catch (error) {
    console.error('Synthesis API error:', error)
    return NextResponse.json(
      { message: 'Error processing synthesis search' },
      { status: 500 }
    )
  }
}
