import { NextRequest, NextResponse } from 'next/server'
import { extractTargetMaterial, detectSynthesisMethod } from '@/lib/recipe/element-parser'
import { generateRecipe, formatRecipe, formatMethodSelection } from '@/lib/recipe/recipe-generator'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: Message[]
  language: 'ko' | 'en'
}

type SynthesisMethodId = 'solid-state' | 'sol-gel' | 'hydrothermal' | 'solution'

/**
 * Parse user input for synthesis method selection
 */
function parseMethodSelection(input: string): SynthesisMethodId | null {
  const lower = input.toLowerCase().trim()

  // Number selection
  if (lower === '1' || lower.includes('solid')) return 'solid-state'
  if (lower === '2' || lower.includes('sol') || lower.includes('gel')) return 'sol-gel'
  if (lower === '3' || lower.includes('hydro') || lower.includes('수열')) return 'hydrothermal'
  if (lower === '4' || lower.includes('solution') || lower.includes('용액')) return 'solution'

  // Korean
  if (lower.includes('고상')) return 'solid-state'
  if (lower.includes('솔겔') || lower.includes('솔-겔')) return 'sol-gel'

  return null
}

/**
 * Get conversation state from messages
 */
function getConversationState(messages: Message[]): {
  targetMaterial: string | null
  awaitingMethodSelection: boolean
  selectedMethod: SynthesisMethodId | null
} {
  let targetMaterial: string | null = null
  let awaitingMethodSelection = false
  let selectedMethod: SynthesisMethodId | null = null

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    if (msg.role === 'user') {
      // Try to extract target material
      const extracted = extractTargetMaterial(msg.content)
      if (extracted) {
        targetMaterial = extracted
      }

      // Try to detect method in user input
      const method = detectSynthesisMethod(msg.content) as SynthesisMethodId | null
      if (method) {
        selectedMethod = method
      }

      // Check for method selection response
      if (awaitingMethodSelection) {
        const parsedMethod = parseMethodSelection(msg.content)
        if (parsedMethod) {
          selectedMethod = parsedMethod
          awaitingMethodSelection = false
        }
      }
    }

    if (msg.role === 'assistant') {
      // Check if we asked for method selection
      if (msg.content.includes('어떤 합성 방법') || msg.content.includes('Which synthesis method')) {
        awaitingMethodSelection = true
      }
    }
  }

  return { targetMaterial, awaitingMethodSelection, selectedMethod }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { messages, language } = body

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const isKorean = language === 'ko'

    // Analyze conversation state
    const state = getConversationState(messages)

    // Case 1: No target material yet - try to extract from current message
    if (!state.targetMaterial) {
      const target = extractTargetMaterial(lastMessage.content)
      if (target) {
        state.targetMaterial = target
      } else {
        // Ask for target material
        const prompt = isKorean
          ? '어떤 재료를 합성하고 싶으신가요? 화학식을 입력해주세요. (예: LiCoO2, IrRuNi, BaTiO3)'
          : 'What material would you like to synthesize? Please enter the chemical formula. (e.g., LiCoO2, IrRuNi, BaTiO3)'
        return NextResponse.json({ message: prompt })
      }
    }

    // Case 2: Have target, check for method in current message
    const methodInMessage = parseMethodSelection(lastMessage.content)
    if (methodInMessage) {
      state.selectedMethod = methodInMessage
    }

    // Case 3: Have target but no method - ask for method
    if (!state.selectedMethod) {
      const methodSelection = formatMethodSelection(state.targetMaterial!, language)
      return NextResponse.json({ message: methodSelection })
    }

    // Case 4: Have both target and method - generate recipe
    const recipe = generateRecipe(state.targetMaterial!, state.selectedMethod, language)

    if (!recipe) {
      const errorMsg = isKorean
        ? `죄송합니다. ${state.targetMaterial}에 대한 레시피를 생성할 수 없습니다. 다른 화학식을 시도해주세요.`
        : `Sorry, I couldn't generate a recipe for ${state.targetMaterial}. Please try a different formula.`
      return NextResponse.json({ message: errorMsg })
    }

    // Check for missing elements
    if (recipe.precursors.length === 0) {
      const errorMsg = isKorean
        ? `${state.targetMaterial}의 일부 원소에 대한 전구체 정보가 없습니다. 일반적인 원소를 포함한 화학식을 시도해주세요.`
        : `Some elements in ${state.targetMaterial} don't have precursor information. Please try a formula with common elements.`
      return NextResponse.json({ message: errorMsg })
    }

    const formattedRecipe = formatRecipe(recipe, language)

    // Add follow-up prompt
    const followUp = isKorean
      ? '\n\n---\n💬 다른 조건이 필요하시면 말씀해주세요. (예: "더 낮은 온도로", "다른 전구체로", "다른 방법으로")'
      : '\n\n---\n💬 Let me know if you need different conditions. (e.g., "lower temperature", "different precursors", "different method")'

    return NextResponse.json({
      message: formattedRecipe + followUp
    })

  } catch (error) {
    console.error('Recipe API error:', error)
    return NextResponse.json(
      { message: 'Error generating recipe' },
      { status: 500 }
    )
  }
}
