import { NextRequest, NextResponse } from 'next/server'
import {
  generateCombinations,
  combinationCount,
  parseResearchQuery,
  parseElementGroup,
  parseSystemSize,
  COMMON_TRANSITION_METALS,
  NOBLE_METALS,
} from '@/lib/research/element-combinations'
import { searchByElements, searchStableMaterials } from '@/lib/materials-api'
import { searchByFormula } from '@/data/synthesis-recipes'

interface ResearchStep {
  type: 'info' | 'progress' | 'result' | 'summary'
  content: string
}

interface CandidateResult {
  elements: string[]
  formula: string
  materialsFound: number
  stablePhases: number
  synthesisRecipes: number
  score: number
  reasoning: string[]  // Why this candidate is promising
  knownPhases: string[]  // Known stable phases
}

// Screen a single combination
async function screenCombination(elements: string[]): Promise<CandidateResult> {
  const formula = elements.join('')
  const reasoning: string[] = []
  const knownPhases: string[] = []

  // Search for materials with these elements
  let materialsFound = 0
  let stablePhases = 0

  try {
    const searchResult = await searchByElements(elements, 5)
    // Count results (rough parsing)
    const matches = searchResult.match(/\*\*([A-Za-z0-9]+)\*\*/g)
    materialsFound = matches ? matches.length : 0

    // Extract phase names
    if (matches) {
      matches.slice(0, 3).forEach(m => {
        const phaseName = m.replace(/\*\*/g, '')
        if (phaseName && !knownPhases.includes(phaseName)) {
          knownPhases.push(phaseName)
        }
      })
    }

    // Check for stable materials (E_hull = 0 or close)
    const hullMatches = searchResult.match(/hull:\s*(\d+\.?\d*)/gi)
    if (hullMatches) {
      hullMatches.forEach(h => {
        const value = parseFloat(h.replace(/hull:\s*/i, ''))
        if (value < 0.05) stablePhases++
      })
    }

    if (materialsFound > 0) {
      reasoning.push(`Materials Project에서 ${materialsFound}개 화합물 발견`)
    }
    if (stablePhases > 0) {
      reasoning.push(`${stablePhases}개 열역학적 안정상 존재 (E_hull ≈ 0)`)
    }
  } catch {
    // API error, skip
  }

  // Check synthesis recipes
  let synthesisRecipes = 0
  try {
    const recipes = searchByFormula(formula, 5)
    synthesisRecipes = recipes.length

    if (synthesisRecipes > 0) {
      reasoning.push(`${synthesisRecipes}개 합성 레시피 존재 → 실험적 합성 가능성 높음`)
    }
  } catch {
    // Skip
  }

  // Add element-based reasoning
  const hasNoble = elements.some(e => ['Pt', 'Pd', 'Ir', 'Ru', 'Rh', 'Au', 'Ag'].includes(e))
  const hasMagnetic = elements.some(e => ['Fe', 'Co', 'Ni'].includes(e))
  const hasRefractory = elements.some(e => ['W', 'Mo', 'Ta', 'Nb', 'Re'].includes(e))

  if (hasNoble) reasoning.push('귀금속 포함 → 촉매/전극 응용 가능')
  if (hasMagnetic) reasoning.push('자성 원소 포함 → 자성체/스핀트로닉스 응용')
  if (hasRefractory) reasoning.push('고융점 원소 포함 → 고온 구조재료 응용')

  // Calculate score with weights
  // - Stable phases are most important (experimentally verified)
  // - Synthesis recipes mean it's actually synthesizable
  // - Number of materials shows research interest
  const score = (materialsFound * 2) + (stablePhases * 10) + (synthesisRecipes * 5)

  // Add score reasoning
  if (score > 0 && reasoning.length === 0) {
    reasoning.push('데이터베이스에 관련 정보 있음')
  }

  return {
    elements,
    formula,
    materialsFound,
    stablePhases,
    synthesisRecipes,
    score,
    reasoning,
    knownPhases,
  }
}

// Main research function
async function conductResearch(
  message: string,
  language: string
): Promise<{ steps: ResearchStep[]; candidates: CandidateResult[] }> {
  const steps: ResearchStep[] = []
  const candidates: CandidateResult[] = []
  const isKorean = language === 'ko'

  // Parse the research query
  const query = parseResearchQuery(message)
  const elementGroup = parseElementGroup(message)
  const systemSize = parseSystemSize(message)

  // Determine elements to use
  let elements: string[] = []
  let groupName = ''

  if (elementGroup) {
    elements = elementGroup
    if (elementGroup === COMMON_TRANSITION_METALS) {
      groupName = isKorean ? '전이금속' : 'transition metals'
    } else if (elementGroup === NOBLE_METALS) {
      groupName = isKorean ? '귀금속' : 'noble metals'
    } else {
      groupName = isKorean ? '원소 그룹' : 'element group'
    }
  } else if (query.elements && query.elements.length > 0) {
    elements = query.elements
    groupName = elements.join(', ')
  } else {
    // Default to common transition metals
    elements = COMMON_TRANSITION_METALS.slice(0, 12) // First 12 for speed
    groupName = isKorean ? '주요 전이금속' : 'common transition metals'
  }

  const totalCombinations = combinationCount(elements.length, systemSize)
  const systemName = systemSize === 2 ? (isKorean ? '2원계' : 'binary') :
                     systemSize === 3 ? (isKorean ? '3원계' : 'ternary') :
                     systemSize === 4 ? (isKorean ? '4원계' : 'quaternary') :
                     `${systemSize}-component`

  // Step 1: Analysis
  steps.push({
    type: 'info',
    content: isKorean
      ? `🔬 **연구 쿼리 분석**\n\n` +
        `- 원소 그룹: ${groupName} (${elements.length}개)\n` +
        `- 시스템: ${systemName}\n` +
        `- 총 조합 수: ${totalCombinations.toLocaleString()}개\n` +
        (query.application ? `- 응용 분야: ${query.application}\n` : '') +
        (query.properties?.stable ? `- 조건: 안정상 우선\n` : '')
      : `🔬 **Research Query Analysis**\n\n` +
        `- Element group: ${groupName} (${elements.length})\n` +
        `- System: ${systemName}\n` +
        `- Total combinations: ${totalCombinations.toLocaleString()}\n` +
        (query.application ? `- Application: ${query.application}\n` : '') +
        (query.properties?.stable ? `- Condition: Stable phases priority\n` : '')
  })

  // Limit combinations for practical screening
  const maxScreening = Math.min(totalCombinations, 30) // Screen up to 30 for speed

  steps.push({
    type: 'progress',
    content: isKorean
      ? `⏳ ${maxScreening}개 조합 스크리닝 중... (전체 ${totalCombinations}개 중 샘플링)`
      : `⏳ Screening ${maxScreening} combinations... (sampled from ${totalCombinations} total)`
  })

  // Generate combinations
  const allCombinations = generateCombinations(elements, systemSize)

  // Sample combinations if too many
  let selectedCombinations = allCombinations
  if (allCombinations.length > maxScreening) {
    // Random sampling + include some "interesting" ones
    const shuffled = allCombinations.sort(() => Math.random() - 0.5)
    selectedCombinations = shuffled.slice(0, maxScreening)
  }

  // Screen each combination
  for (const combo of selectedCombinations) {
    try {
      const result = await screenCombination(combo)
      if (result.score > 0) {
        candidates.push(result)
      }
    } catch {
      // Skip failed screenings
    }
  }

  // Sort by score
  candidates.sort((a, b) => b.score - a.score)

  // Take top results
  const topCandidates = candidates.slice(0, 15)

  // Step 3: Scoring methodology explanation
  steps.push({
    type: 'info',
    content: isKorean
      ? `📐 **스코어링 기준**\n\n` +
        `| 항목 | 가중치 | 근거 |\n` +
        `|------|--------|------|\n` +
        `| 안정상 | ×10 | E_hull ≈ 0 → 합성 가능성 높음 |\n` +
        `| 합성 레시피 | ×5 | 실험적 검증됨 |\n` +
        `| 재료 수 | ×2 | 연구 관심도 |\n`
      : `📐 **Scoring Methodology**\n\n` +
        `| Factor | Weight | Rationale |\n` +
        `|--------|--------|----------|\n` +
        `| Stable phases | ×10 | E_hull ≈ 0 → high synthesizability |\n` +
        `| Synthesis recipes | ×5 | Experimentally verified |\n` +
        `| Materials count | ×2 | Research interest |\n`
  })

  // Step 4: Results with reasoning
  if (topCandidates.length > 0) {
    let resultContent = isKorean
      ? `📊 **스크리닝 결과** (상위 ${Math.min(topCandidates.length, 10)}개)\n\n`
      : `📊 **Screening Results** (Top ${Math.min(topCandidates.length, 10)})\n\n`

    topCandidates.slice(0, 10).forEach((c, i) => {
      resultContent += `**${i + 1}. ${c.elements.join('-')}** (Score: ${c.score})\n`

      // Show known phases if any
      if (c.knownPhases.length > 0) {
        resultContent += isKorean
          ? `   📌 알려진 상: ${c.knownPhases.join(', ')}\n`
          : `   📌 Known phases: ${c.knownPhases.join(', ')}\n`
      }

      // Show reasoning
      if (c.reasoning.length > 0) {
        resultContent += isKorean ? `   💡 근거:\n` : `   💡 Reasoning:\n`
        c.reasoning.forEach(r => {
          resultContent += `      • ${r}\n`
        })
      }

      // Statistics
      resultContent += isKorean
        ? `   📈 통계: MP ${c.materialsFound}개 | 안정상 ${c.stablePhases}개 | 레시피 ${c.synthesisRecipes}개\n`
        : `   📈 Stats: MP ${c.materialsFound} | Stable ${c.stablePhases} | Recipes ${c.synthesisRecipes}\n`
      resultContent += '\n'
    })

    steps.push({ type: 'result', content: resultContent })
  } else {
    steps.push({
      type: 'result',
      content: isKorean
        ? '❌ 스크리닝 결과 후보를 찾지 못했습니다.\n\n가능한 원인:\n- 해당 조합의 화합물이 데이터베이스에 없음\n- API 호출 제한'
        : '❌ No candidates found in screening.\n\nPossible reasons:\n- No compounds with this combination in database\n- API rate limiting'
    })
  }

  // Step 4: Summary
  const summary = isKorean
    ? `📋 **요약**\n\n` +
      `- 스크리닝: ${selectedCombinations.length}개 조합\n` +
      `- 유효 후보: ${candidates.length}개\n` +
      `- 추천 시스템: ${topCandidates.slice(0, 3).map(c => c.elements.join('-')).join(', ')}\n\n` +
      `💡 상세 정보는 Database Agent에서 개별 조회하세요.`
    : `📋 **Summary**\n\n` +
      `- Screened: ${selectedCombinations.length} combinations\n` +
      `- Valid candidates: ${candidates.length}\n` +
      `- Top systems: ${topCandidates.slice(0, 3).map(c => c.elements.join('-')).join(', ')}\n\n` +
      `💡 Query individual systems in Database Agent for details.`

  steps.push({ type: 'summary', content: summary })

  return { steps, candidates: topCandidates }
}

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'ko' } = await request.json()

    const { steps, candidates } = await conductResearch(message, language)

    return NextResponse.json({
      steps,
      candidates,
    })
  } catch (error) {
    console.error('Research API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', steps: [], candidates: [] },
      { status: 500 }
    )
  }
}
