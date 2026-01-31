import { NextRequest, NextResponse } from 'next/server'
import {
  searchMaterials,
  searchByElements,
  getMaterial,
  searchByBandGap,
  searchStableMaterials,
} from '@/lib/materials-api'
import { searchByFormula, searchByPrecursor, searchByTemperature } from '@/data/synthesis-recipes'
import { generateRecipe } from '@/lib/recipe/recipe-generator'
import { extractTargetMaterial } from '@/lib/recipe/element-parser'
import {
  analyzeMaterial,
  getPhaseDiagram,
  getElementInfo,
  checkComputeServer,
  checkMLIPStatus,
  calculateEnergy,
  calculateFormationEnergy,
  relaxStructure,
} from '@/lib/compute-api'

type AgentType = 'database' | 'synthesis' | 'compute'

// Database Agent: Direct search
async function handleDatabaseAgent(message: string): Promise<{ thinking: string; content: string }> {
  const lowerMsg = message.toLowerCase()

  // Detect search type
  if (lowerMsg.includes('band gap') || lowerMsg.includes('밴드갭') || lowerMsg.includes('bandgap')) {
    const match = message.match(/(\d+(?:\.\d+)?)\s*[-~에서to]\s*(\d+(?:\.\d+)?)/i)
    if (match) {
      const min = parseFloat(match[1])
      const max = parseFloat(match[2])
      const thinking = `Band gap ${min}-${max} eV 범위 검색 중...`
      const result = await searchByBandGap(min, max, 10)
      return { thinking, content: result }
    }
  }

  if (lowerMsg.includes('stable') || lowerMsg.includes('안정')) {
    const elements = message.match(/[A-Z][a-z]?/g) || []
    if (elements.length > 0) {
      const thinking = `${elements.join('-')} 안정한 재료 검색 중...`
      const result = await searchStableMaterials(elements, 10)
      return { thinking, content: result }
    }
  }

  // Check for mp-id
  const mpMatch = message.match(/mp-\d+/i)
  if (mpMatch) {
    const thinking = `${mpMatch[0]} 상세 정보 조회 중...`
    const result = await getMaterial(mpMatch[0])
    return { thinking, content: result }
  }

  // Check for element combination (e.g., Li-Co-O)
  const elementMatch = message.match(/([A-Z][a-z]?)\s*[-,]\s*([A-Z][a-z]?)\s*[-,]?\s*([A-Z][a-z]?)?/g)
  if (elementMatch) {
    const elements = message.match(/[A-Z][a-z]?/g) || []
    if (elements.length >= 2) {
      const thinking = `${elements.join('-')} 원소 조합 검색 중...`
      const result = await searchByElements(elements, 10)
      return { thinking, content: result }
    }
  }

  // Default: formula search
  const formulaMatch = message.match(/([A-Z][a-z]?\d*)+/g)
  if (formulaMatch && formulaMatch[0]) {
    const formula = formulaMatch[0]
    const thinking = `"${formula}" 재료 검색 중...`
    const result = await searchMaterials(formula, 10)
    return { thinking, content: result }
  }

  return {
    thinking: '검색어 분석 중...',
    content: '검색어를 인식하지 못했습니다. 화학식(예: LiCoO2) 또는 원소 조합(예: Li-Co-O)을 입력해주세요.'
  }
}

// Synthesis Agent: Recipe search/generation
async function handleSynthesisAgent(message: string): Promise<{ thinking: string; content: string }> {
  const lowerMsg = message.toLowerCase()

  // Check for temperature range
  const tempMatch = message.match(/(\d+)\s*[-~에서to]\s*(\d+)\s*°?C?/i)
  if (tempMatch && (lowerMsg.includes('온도') || lowerMsg.includes('temperature'))) {
    const min = parseInt(tempMatch[1])
    const max = parseInt(tempMatch[2])
    const thinking = `${min}-${max}°C 온도 범위 합성 검색 중...`
    const recipes = searchByTemperature(min, max, 10)

    if (recipes.length === 0) {
      return { thinking, content: '해당 온도 범위의 레시피를 찾지 못했습니다.' }
    }

    let content = `**${recipes.length}개 레시피 발견 (${min}-${max}°C):**\n\n`
    recipes.slice(0, 5).forEach((r, i) => {
      const tempStr = r.temperature_min ? `${r.temperature_min}-${r.temperature_max || r.temperature_min}°C` : 'N/A'
      content += `${i + 1}. **${r.target_formula}** (${r.synthesis_type})\n`
      content += `   - 전구체: ${r.precursors.map(p => p.formula).join(', ')}\n`
      content += `   - 온도: ${tempStr}\n\n`
    })
    return { thinking, content }
  }

  // Check for recipe generation request
  if (lowerMsg.includes('만들') || lowerMsg.includes('생성') || lowerMsg.includes('generate') || lowerMsg.includes('create')) {
    const formulaMatch = message.match(/([A-Z][a-z]?\d*)+/g)
    if (formulaMatch && formulaMatch[0]) {
      const formula = formulaMatch[0]
      const { elements } = extractTargetMaterial(formula)

      if (elements.length === 0) {
        return { thinking: '화학식 분석 중...', content: '화학식에서 원소를 추출할 수 없습니다.' }
      }

      // Detect method
      let method = 'solid-state'
      if (lowerMsg.includes('sol-gel') || lowerMsg.includes('솔겔') || lowerMsg.includes('솔-겔')) {
        method = 'sol-gel'
      } else if (lowerMsg.includes('hydrothermal') || lowerMsg.includes('수열')) {
        method = 'hydrothermal'
      } else if (lowerMsg.includes('solution') || lowerMsg.includes('용액')) {
        method = 'solution-based'
      }

      const thinking = `"${formula}" ${method} 합성 레시피 생성 중...`
      const recipe = generateRecipe(elements, method)

      let content = `**${formula} ${method} 합성 레시피**\n\n`
      content += `**전구체:**\n${recipe.precursors.map(p => `- ${p.name} (${p.formula})`).join('\n')}\n\n`
      content += `**조건:**\n- 온도: ${recipe.conditions.temperature}\n- 시간: ${recipe.conditions.time}\n- 분위기: ${recipe.conditions.atmosphere}\n\n`
      content += `**단계:**\n${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`

      return { thinking, content }
    }
  }

  // Check for precursor search
  if (lowerMsg.includes('전구체') || lowerMsg.includes('precursor') || lowerMsg.includes('사용')) {
    const formulaMatch = message.match(/([A-Z][a-z]?\d*)+/g)
    if (formulaMatch && formulaMatch[0]) {
      const precursor = formulaMatch[0]
      const thinking = `"${precursor}" 전구체 검색 중...`
      const recipes = searchByPrecursor(precursor, 10)

      if (recipes.length === 0) {
        return { thinking, content: `"${precursor}"를 전구체로 사용하는 레시피를 찾지 못했습니다.` }
      }

      let content = `**${recipes.length}개 레시피 발견 (${precursor} 전구체):**\n\n`
      recipes.slice(0, 5).forEach((r, i) => {
        const tempStr = r.temperature_min ? `${r.temperature_min}-${r.temperature_max || r.temperature_min}°C` : 'N/A'
        content += `${i + 1}. **${r.target_formula}** (${r.synthesis_type})\n`
        content += `   - 전구체: ${r.precursors.map(p => p.formula).join(', ')}\n`
        content += `   - 온도: ${tempStr}\n\n`
      })
      return { thinking, content }
    }
  }

  // Default: formula search
  const formulaMatch = message.match(/([A-Z][a-z]?\d*)+/g)
  if (formulaMatch && formulaMatch[0]) {
    const formula = formulaMatch[0]
    const thinking = `"${formula}" 합성 레시피 검색 중...`
    const recipes = searchByFormula(formula, 10)

    if (recipes.length === 0) {
      return { thinking, content: `"${formula}"에 대한 합성 레시피를 찾지 못했습니다.\n\n레시피 생성을 원하시면 "${formula} 레시피 만들어줘"라고 요청해주세요.` }
    }

    let content = `**${recipes.length}개 레시피 발견:**\n\n`
    recipes.slice(0, 5).forEach((r, i) => {
      const tempStr = r.temperature_min ? `${r.temperature_min}-${r.temperature_max || r.temperature_min}°C` : 'N/A'
      content += `${i + 1}. **${r.target_formula}** (${r.synthesis_type})\n`
      content += `   - 전구체: ${r.precursors.map(p => p.formula).join(', ')}\n`
      content += `   - 온도: ${tempStr}\n\n`
    })
    return { thinking, content }
  }

  return {
    thinking: '검색어 분석 중...',
    content: '검색어를 인식하지 못했습니다. 화학식(예: LiCoO2)을 입력하거나 "LiCoO2 레시피 만들어줘"와 같이 요청해주세요.'
  }
}

// Compute Agent: Structure analysis, phase diagram, element info, MLIP calculations
async function handleComputeAgent(message: string): Promise<{ thinking: string; content: string }> {
  // Check server availability
  const serverAvailable = await checkComputeServer()
  if (!serverAvailable) {
    return {
      thinking: 'Python 계산 서버 연결 확인 중...',
      content: '⚠️ Python 계산 서버가 실행되지 않았습니다.\n\n서버 시작 방법:\n```bash\ncd python-server\npip install upet  # MLIP 설치\npython -m uvicorn main:app --port 8000\n```'
    }
  }

  const lowerMsg = message.toLowerCase()

  // MLIP Energy calculation
  if (lowerMsg.includes('에너지') || lowerMsg.includes('energy')) {
    const mpMatch = message.match(/mp-\d+/i)
    if (mpMatch) {
      // Check if formation energy is requested
      if (lowerMsg.includes('formation') || lowerMsg.includes('생성') || lowerMsg.includes('형성')) {
        const thinking = `${mpMatch[0]} formation energy 계산 중... (UPET MLIP)`
        const result = await calculateFormationEnergy(mpMatch[0])
        return { thinking, content: result }
      }
      const thinking = `${mpMatch[0]} 에너지 계산 중... (UPET MLIP)`
      const result = await calculateEnergy(mpMatch[0])
      return { thinking, content: result }
    }
  }

  // MLIP Formation energy (alternative keywords)
  if (lowerMsg.includes('formation') || lowerMsg.includes('생성 에너지') || lowerMsg.includes('형성 에너지')) {
    const mpMatch = message.match(/mp-\d+/i)
    if (mpMatch) {
      const thinking = `${mpMatch[0]} formation energy 계산 중... (UPET MLIP)`
      const result = await calculateFormationEnergy(mpMatch[0])
      return { thinking, content: result }
    }
  }

  // MLIP Structure relaxation
  if (lowerMsg.includes('relax') || lowerMsg.includes('최적화') || lowerMsg.includes('relaxation')) {
    const mpMatch = message.match(/mp-\d+/i)
    if (mpMatch) {
      const thinking = `${mpMatch[0]} 구조 최적화 중... (UPET MLIP)`
      const result = await relaxStructure(mpMatch[0])
      return { thinking, content: result }
    }
  }

  // MLIP status check
  if (lowerMsg.includes('mlip') || lowerMsg.includes('upet')) {
    const thinking = 'MLIP 상태 확인 중...'
    const status = await checkMLIPStatus()
    if (status.available) {
      const content = [
        '## ✅ MLIP (UPET) 사용 가능',
        '',
        `- 모델: ${status.model}`,
        `- 버전: ${status.version}`,
        `- 이론 수준: ${status.theory_level}`,
        '',
        '### 사용 가능한 기능',
        ...(status.capabilities || []).map(c => `- ${c}`),
        '',
        '### 사용 예시',
        '- "mp-149 에너지 계산해줘"',
        '- "mp-149 formation energy"',
        '- "mp-149 구조 최적화"',
      ].join('\n')
      return { thinking, content }
    } else {
      return {
        thinking,
        content: `## ⚠️ MLIP 사용 불가\n\n${status.message}\n\n설치: \`${status.install_command}\``
      }
    }
  }

  // Phase diagram
  if (lowerMsg.includes('phase') || lowerMsg.includes('상평형') || lowerMsg.includes('diagram')) {
    const elements = message.match(/[A-Z][a-z]?/g) || []
    if (elements.length >= 2 && elements.length <= 4) {
      const thinking = `${elements.join('-')} phase diagram 계산 중...`
      const result = await getPhaseDiagram(elements)
      return { thinking, content: result }
    }
  }

  // Element info
  if (lowerMsg.includes('원소') || lowerMsg.includes('element') || lowerMsg.includes('정보')) {
    const elementMatch = message.match(/\b([A-Z][a-z]?)\b/)
    if (elementMatch) {
      const thinking = `${elementMatch[1]} 원소 정보 조회 중...`
      const result = await getElementInfo(elementMatch[1])
      return { thinking, content: result }
    }
  }

  // Structure analysis with mp-id
  const mpMatch = message.match(/mp-\d+/i)
  if (mpMatch) {
    const thinking = `${mpMatch[0]} 구조 분석 중...`
    const result = await analyzeMaterial(mpMatch[0])
    return { thinking, content: result }
  }

  // Default: try to find elements for element info
  const elements = message.match(/[A-Z][a-z]?/g)
  if (elements && elements.length === 1) {
    const thinking = `${elements[0]} 원소 정보 조회 중...`
    const result = await getElementInfo(elements[0])
    return { thinking, content: result }
  }

  return {
    thinking: '명령어 분석 중...',
    content: `사용 가능한 기능:\n\n**📊 구조 분석**\n- "mp-149 분석해줘"\n- "Li-Fe-O phase diagram"\n- "Fe 원소 정보"\n\n**⚡ MLIP 계산 (UPET)**\n- "mp-149 에너지 계산" - 총 에너지\n- "mp-149 formation energy" - 생성 에너지\n- "mp-149 구조 최적화" - Relaxation\n- "MLIP 상태" - UPET 상태 확인`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, agent, language = 'ko' } = await request.json()

    let result: { thinking: string; content: string }

    switch (agent as AgentType) {
      case 'database':
        result = await handleDatabaseAgent(message)
        break
      case 'synthesis':
        result = await handleSynthesisAgent(message)
        break
      case 'compute':
        result = await handleComputeAgent(message)
        break
      default:
        result = { thinking: '', content: '알 수 없는 Agent입니다.' }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Single agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error', thinking: '', content: '오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
