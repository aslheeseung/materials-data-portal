/**
 * Recipe Generator - Generate synthesis recipes based on target material and method
 */

import { parseFormula, generateMaterialName } from './element-parser'
import { getBestPrecursor, hasElement, PrecursorInfo } from './precursor-db'
import { getMethod, needsReducingAtmosphere, SynthesisMethod } from './synthesis-methods'
import { searchByFormula } from '@/data/synthesis-recipes'

export interface GeneratedRecipe {
  target: {
    formula: string
    name: string
    elements: string[]
  }
  method: SynthesisMethod
  precursors: {
    element: string
    precursor: PrecursorInfo
    stoichiometry: string
  }[]
  conditions: {
    temperature: string
    time: string
    atmosphere: string
    heatingRate?: string
  }
  procedure: {
    step: number
    name: string
    action: string
    details?: string
    temperature?: string
    time?: string
  }[]
  characterization: string[]
  safetyNotes: string[]
  references: {
    material: string
    doi: string
    temperature?: string
  }[]
}

/**
 * Generate a complete synthesis recipe
 */
export function generateRecipe(
  targetFormula: string,
  methodId: 'solid-state' | 'sol-gel' | 'hydrothermal' | 'solution',
  language: 'ko' | 'en' = 'ko'
): GeneratedRecipe | null {
  // Parse target formula
  const parsed = parseFormula(targetFormula)
  if (parsed.uniqueElements.length === 0) {
    return null
  }

  // Get synthesis method
  const method = getMethod(methodId)
  if (!method) {
    return null
  }

  // Get precursors for each element
  const precursors: GeneratedRecipe['precursors'] = []
  const missingElements: string[] = []

  for (const element of parsed.uniqueElements) {
    // Skip common non-metal elements that don't need precursors in some cases
    if (['O', 'N', 'C', 'H'].includes(element)) {
      continue
    }

    const precursor = getBestPrecursor(element, methodId)
    if (precursor) {
      const elInfo = parsed.elements.find(e => e.symbol === element)
      precursors.push({
        element,
        precursor,
        stoichiometry: elInfo ? `${elInfo.count} mol` : '1 mol',
      })
    } else if (hasElement(element)) {
      // Has element in DB but no precursor for this method - use fallback
      const fallbackPrecursor = getBestPrecursor(element, 'solid-state') ||
                                getBestPrecursor(element, 'solution')
      if (fallbackPrecursor) {
        precursors.push({
          element,
          precursor: fallbackPrecursor,
          stoichiometry: '1 mol',
        })
      } else {
        missingElements.push(element)
      }
    } else {
      missingElements.push(element)
    }
  }

  // Determine conditions
  const needsReducing = needsReducingAtmosphere(methodId, parsed.uniqueElements)
  const [tempMin, tempMax] = method.conditions.temperatureRange
  const [timeMin, timeMax] = method.conditions.timeRange

  const temperature = `${tempMin + Math.round((tempMax - tempMin) * 0.3)}-${tempMin + Math.round((tempMax - tempMin) * 0.7)}°C`
  const time = `${timeMin + Math.round((timeMax - timeMin) * 0.3)}-${timeMin + Math.round((timeMax - timeMin) * 0.7)}h`
  const atmosphere = needsReducing
    ? 'Ar/H2 (5%)'
    : method.conditions.atmosphere[0]

  // Generate procedure
  const procedure: GeneratedRecipe['procedure'] = method.steps.map((step, index) => ({
    step: index + 1,
    name: step.name,
    action: language === 'ko' ? step.description.ko : step.description.en,
    details: step.details ? (language === 'ko' ? step.details.ko : step.details.en) : undefined,
    temperature: step.temperature,
    time: step.time,
  }))

  // Add reduction step if needed for solid-state
  if (needsReducing && methodId === 'solid-state') {
    // Modify sintering step
    const sinteringIdx = procedure.findIndex(p => p.name === 'sintering')
    if (sinteringIdx >= 0) {
      procedure[sinteringIdx].details = language === 'ko'
        ? '환원 분위기(Ar/H2)에서 가열하여 금속 상 형성'
        : 'Heat under reducing atmosphere (Ar/H2) to form metallic phase'
    }
  }

  // Standard characterization
  const characterization = language === 'ko' ? [
    'XRD: 결정 구조 및 상 확인',
    'SEM-EDS: 형태 및 조성 분석',
    'TEM: 나노구조 관찰 (나노입자의 경우)',
    'BET: 비표면적 측정',
    'XPS: 표면 화학 상태 분석',
  ] : [
    'XRD: Crystal structure and phase confirmation',
    'SEM-EDS: Morphology and composition analysis',
    'TEM: Nanostructure observation (for nanoparticles)',
    'BET: Specific surface area measurement',
    'XPS: Surface chemical state analysis',
  ]

  // Safety notes
  const safetyNotes = language === 'ko' ? [
    '고온 작업 시 내열장갑 착용',
    '분말 취급 시 마스크 착용',
    needsReducing ? 'H2 가스 사용 시 환기 철저' : '',
    '화학물질 취급 시 실험복, 보안경 착용',
  ].filter(Boolean) : [
    'Wear heat-resistant gloves during high-temperature operations',
    'Wear a mask when handling powders',
    needsReducing ? 'Ensure proper ventilation when using H2 gas' : '',
    'Wear lab coat and safety goggles when handling chemicals',
  ].filter(Boolean)

  // Find similar materials from dataset
  const references: GeneratedRecipe['references'] = []
  for (const element of parsed.uniqueElements.slice(0, 2)) {
    const similar = searchByFormula(element, 3)
    for (const recipe of similar) {
      if (!references.find(r => r.doi === recipe.doi)) {
        references.push({
          material: recipe.target_formula,
          doi: recipe.doi,
          temperature: recipe.temperature_max ? `${recipe.temperature_max}°C` : undefined,
        })
      }
      if (references.length >= 3) break
    }
    if (references.length >= 3) break
  }

  return {
    target: {
      formula: targetFormula,
      name: generateMaterialName(parsed.uniqueElements),
      elements: parsed.uniqueElements,
    },
    method,
    precursors,
    conditions: {
      temperature,
      time,
      atmosphere,
      heatingRate: '5°C/min',
    },
    procedure,
    characterization,
    safetyNotes,
    references,
  }
}

/**
 * Format recipe to readable string
 */
export function formatRecipe(recipe: GeneratedRecipe, language: 'ko' | 'en' = 'ko'): string {
  const lines: string[] = []

  // Title
  const methodName = language === 'ko' ? recipe.method.name.ko : recipe.method.name.en
  lines.push(`**${recipe.target.formula} - ${methodName}** ${recipe.method.icon}`)
  lines.push('')

  // Precursors
  lines.push(language === 'ko' ? '📦 **전구체 (Precursors):**' : '📦 **Precursors:**')
  for (const p of recipe.precursors) {
    lines.push(`  - ${p.precursor.formula} (${p.precursor.name})`)
  }
  lines.push('')

  // Conditions
  lines.push(language === 'ko' ? '🔬 **합성 조건:**' : '🔬 **Synthesis Conditions:**')
  lines.push(`  - 🔥 ${language === 'ko' ? '온도' : 'Temperature'}: ${recipe.conditions.temperature}`)
  lines.push(`  - ⏱️ ${language === 'ko' ? '시간' : 'Time'}: ${recipe.conditions.time}`)
  lines.push(`  - 💨 ${language === 'ko' ? '분위기' : 'Atmosphere'}: ${recipe.conditions.atmosphere}`)
  if (recipe.conditions.heatingRate) {
    lines.push(`  - 📈 ${language === 'ko' ? '승온 속도' : 'Heating rate'}: ${recipe.conditions.heatingRate}`)
  }
  lines.push('')

  // Procedure
  lines.push(language === 'ko' ? '⚙️ **실험 절차:**' : '⚙️ **Procedure:**')
  for (const step of recipe.procedure) {
    let stepLine = `  ${step.step}. **${step.action}**`
    if (step.temperature) stepLine += ` (${step.temperature})`
    if (step.time) stepLine += ` - ${step.time}`
    lines.push(stepLine)
    if (step.details) {
      lines.push(`     _${step.details}_`)
    }
  }
  lines.push('')

  // Characterization
  lines.push(language === 'ko' ? '🔍 **분석 방법:**' : '🔍 **Characterization:**')
  for (const char of recipe.characterization) {
    lines.push(`  - ${char}`)
  }
  lines.push('')

  // Safety
  lines.push(language === 'ko' ? '⚠️ **안전 주의사항:**' : '⚠️ **Safety Notes:**')
  for (const note of recipe.safetyNotes) {
    lines.push(`  - ${note}`)
  }
  lines.push('')

  // References
  if (recipe.references.length > 0) {
    lines.push(language === 'ko' ? '📚 **유사 재료 참조:**' : '📚 **Similar Material References:**')
    for (const ref of recipe.references) {
      let refLine = `  - ${ref.material}`
      if (ref.temperature) refLine += ` (${ref.temperature})`
      refLine += ` - [DOI](https://doi.org/${ref.doi})`
      lines.push(refLine)
    }
    lines.push('')
  }

  // Disclaimer
  lines.push('---')
  lines.push(language === 'ko'
    ? '_⚠️ AI 생성 레시피입니다. 실험 전 반드시 문헌을 확인하세요._'
    : '_⚠️ AI-generated recipe. Please verify with literature before experiments._')

  return lines.join('\n')
}

/**
 * Format method selection message
 */
export function formatMethodSelection(targetFormula: string, language: 'ko' | 'en' = 'ko'): string {
  const lines: string[] = []

  if (language === 'ko') {
    lines.push(`**${targetFormula}** 합성을 도와드릴게요! 🧪`)
    lines.push('')
    lines.push('어떤 합성 방법을 원하시나요?')
    lines.push('')
    lines.push('1. 🔥 **Solid-State (고상 합성)** - 고온 소결, 대량 합성에 적합')
    lines.push('2. 🧪 **Sol-Gel (솔-겔)** - 균일한 조성, 낮은 온도')
    lines.push('3. 💧 **Hydrothermal (수열 합성)** - 나노입자, 형태 제어')
    lines.push('4. ⚗️ **Solution-Based (용액 기반)** - 빠른 합성, 금속 나노입자')
    lines.push('')
    lines.push('_숫자나 방법명을 입력해주세요._')
  } else {
    lines.push(`I'll help you synthesize **${targetFormula}**! 🧪`)
    lines.push('')
    lines.push('Which synthesis method would you prefer?')
    lines.push('')
    lines.push('1. 🔥 **Solid-State** - High-temperature sintering, suitable for bulk synthesis')
    lines.push('2. 🧪 **Sol-Gel** - Homogeneous mixing, lower temperature')
    lines.push('3. 💧 **Hydrothermal** - Nanoparticles, morphology control')
    lines.push('4. ⚗️ **Solution-Based** - Fast synthesis, metal nanoparticles')
    lines.push('')
    lines.push('_Enter a number or method name._')
  }

  return lines.join('\n')
}
