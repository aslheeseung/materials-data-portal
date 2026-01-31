import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  searchMaterials,
  searchByElements,
  getMaterial,
  searchByBandGap,
  searchStableMaterials,
} from '@/lib/materials-api'
import { searchByFormula, searchByPrecursor } from '@/data/synthesis-recipes'
import { generateRecipe } from '@/lib/recipe/recipe-generator'
import { extractTargetMaterial } from '@/lib/recipe/element-parser'
import {
  analyzeMaterial,
  getPhaseDiagram,
  getElementInfo,
  checkComputeServer,
} from '@/lib/compute-api'

// OpenAI client - initialized lazily at runtime
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

interface AgentStep {
  agent: 'master' | 'database' | 'synthesis' | 'compute'
  thinking: string
  content: string
}

// Master Agent: Analyzes user intent and plans execution
async function masterAgentPlan(message: string, language: string): Promise<{
  intent: string
  agents: string[]
  tasks: { agent: string; task: string; params: Record<string, unknown> }[]
}> {
  const openai = getOpenAI()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a Master Agent that analyzes user requests about materials science.
Your job is to understand what the user wants and plan which specialized agents to use.

Available Agents:
1. database - Search materials in MP, AFLOW, OQMD, COD databases
2. synthesis - Search synthesis recipes or generate new ones
3. compute - Analyze structures, phase diagrams, element info (requires local server)

Analyze the user's request and return a JSON plan.

Response format (JSON only, no markdown):
{
  "intent": "brief description of what user wants",
  "agents": ["agent1", "agent2"],
  "tasks": [
    {"agent": "database", "task": "search_formula", "params": {"formula": "LiCoO2"}},
    {"agent": "synthesis", "task": "search_recipe", "params": {"formula": "LiCoO2"}}
  ]
}

Available tasks:
- database: search_formula, search_elements, search_bandgap, search_stable, get_material
- synthesis: search_recipe, generate_recipe
- compute: analyze_structure, phase_diagram, element_info`
      },
      { role: 'user', content: message }
    ],
    temperature: 0.3,
  })

  try {
    const content = response.choices[0].message.content || '{}'
    // Remove markdown code blocks if present
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    // Default plan if parsing fails
    return {
      intent: message,
      agents: ['database'],
      tasks: [{ agent: 'database', task: 'search_formula', params: { formula: message } }]
    }
  }
}

// Database Agent: Execute database searches
async function databaseAgentExecute(
  task: string,
  params: Record<string, unknown>
): Promise<{ thinking: string; result: string }> {
  let thinking = ''
  let result = ''

  switch (task) {
    case 'search_formula': {
      const formula = params.formula as string
      thinking = `Materials Project에서 "${formula}" 검색 중...`
      result = await searchMaterials(formula, 5)
      break
    }
    case 'search_elements': {
      const elements = params.elements as string[]
      thinking = `원소 조합 ${elements.join('-')} 검색 중...`
      result = await searchByElements(elements, 5)
      break
    }
    case 'search_bandgap': {
      const min = params.min_gap as number
      const max = params.max_gap as number
      thinking = `Band gap ${min}-${max} eV 범위 검색 중...`
      result = await searchByBandGap(min, max, 5)
      break
    }
    case 'search_stable': {
      const elements = params.elements as string[]
      thinking = `${elements.join('-')} 안정한 재료 검색 중...`
      result = await searchStableMaterials(elements, 5)
      break
    }
    case 'get_material': {
      const id = params.material_id as string
      thinking = `${id} 상세 정보 조회 중...`
      result = await getMaterial(id)
      break
    }
    default:
      thinking = '알 수 없는 작업'
      result = '지원하지 않는 작업입니다.'
  }

  return { thinking, result }
}

// Synthesis Agent: Handle synthesis recipe tasks
async function synthesisAgentExecute(
  task: string,
  params: Record<string, unknown>
): Promise<{ thinking: string; result: string }> {
  let thinking = ''
  let result = ''

  switch (task) {
    case 'search_recipe': {
      const formula = params.formula as string
      thinking = `"${formula}" 합성 레시피 검색 중... (Ceder Group DB)`
      const recipes = searchByFormula(formula, 5)
      if (recipes.length === 0) {
        // Try precursor search
        const precursorRecipes = searchByPrecursor(formula, 5)
        if (precursorRecipes.length === 0) {
          result = `"${formula}"에 대한 합성 레시피를 찾지 못했습니다.`
        } else {
          result = `**${precursorRecipes.length}개 레시피 발견 (전구체 검색):**\n\n`
          precursorRecipes.slice(0, 3).forEach((r, i) => {
            const tempStr = r.temperature_min ? `${r.temperature_min}-${r.temperature_max || r.temperature_min}°C` : 'N/A'
            result += `${i + 1}. **${r.target_formula}** (${r.synthesis_type})\n`
            result += `   - 전구체: ${r.precursors.map(p => p.formula).join(', ')}\n`
            result += `   - 온도: ${tempStr}\n\n`
          })
        }
      } else {
        result = `**${recipes.length}개 레시피 발견:**\n\n`
        recipes.slice(0, 3).forEach((r, i) => {
          const tempStr = r.temperature_min ? `${r.temperature_min}-${r.temperature_max || r.temperature_min}°C` : 'N/A'
          result += `${i + 1}. **${r.target_formula}** (${r.synthesis_type})\n`
          result += `   - 전구체: ${r.precursors.map(p => p.formula).join(', ')}\n`
          result += `   - 온도: ${tempStr}\n\n`
        })
      }
      break
    }
    case 'generate_recipe': {
      const formula = params.formula as string
      const method = (params.method as string) || 'solid-state'
      thinking = `"${formula}" ${method} 합성 레시피 생성 중...`
      const { elements } = extractTargetMaterial(formula)
      if (elements.length === 0) {
        result = '화학식에서 원소를 추출할 수 없습니다.'
      } else {
        const recipe = generateRecipe(elements, method)
        result = `**${formula} ${method} 합성 레시피**\n\n`
        result += `**전구체:**\n${recipe.precursors.map(p => `- ${p.name} (${p.formula})`).join('\n')}\n\n`
        result += `**조건:**\n- 온도: ${recipe.conditions.temperature}\n- 시간: ${recipe.conditions.time}\n- 분위기: ${recipe.conditions.atmosphere}\n\n`
        result += `**단계:**\n${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      }
      break
    }
    default:
      thinking = '알 수 없는 작업'
      result = '지원하지 않는 작업입니다.'
  }

  return { thinking, result }
}

// Compute Agent: Handle computational tasks
async function computeAgentExecute(
  task: string,
  params: Record<string, unknown>
): Promise<{ thinking: string; result: string }> {
  let thinking = ''
  let result = ''

  // Check if compute server is available
  const serverAvailable = await checkComputeServer()
  if (!serverAvailable) {
    return {
      thinking: 'Python 계산 서버 연결 확인 중...',
      result: '⚠️ Python 계산 서버가 실행되지 않았습니다.\n\n서버 시작: `cd python-server && python -m uvicorn main:app --port 8000`'
    }
  }

  switch (task) {
    case 'analyze_structure': {
      const materialId = params.material_id as string
      thinking = `${materialId} 구조 분석 중... (Pymatgen)`
      result = await analyzeMaterial(materialId)
      break
    }
    case 'phase_diagram': {
      const elements = params.elements as string[]
      thinking = `${elements.join('-')} phase diagram 계산 중...`
      result = await getPhaseDiagram(elements)
      break
    }
    case 'element_info': {
      const symbol = params.symbol as string
      thinking = `${symbol} 원소 정보 조회 중...`
      result = await getElementInfo(symbol)
      break
    }
    default:
      thinking = '알 수 없는 작업'
      result = '지원하지 않는 작업입니다.'
  }

  return { thinking, result }
}

// Master Agent: Synthesize final response
async function masterAgentSynthesize(
  userMessage: string,
  agentResults: { agent: string; result: string }[],
  language: string
): Promise<string> {
  const openai = getOpenAI()

  const resultsText = agentResults
    .map(r => `[${r.agent.toUpperCase()} AGENT]\n${r.result}`)
    .join('\n\n---\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a Master Agent synthesizing results from specialized agents.
Summarize the findings clearly and helpfully for the user.
${language === 'ko' ? '한국어로 답변하세요.' : 'Respond in English.'}
Be concise but comprehensive. Highlight key findings.`
      },
      {
        role: 'user',
        content: `User asked: "${userMessage}"

Agent results:
${resultsText}

Please synthesize a helpful response.`
      }
    ],
    temperature: 0.5,
  })

  return response.choices[0].message.content || '결과를 정리하지 못했습니다.'
}

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'ko' } = await request.json()

    const steps: AgentStep[] = []

    // Step 1: Master Agent plans the execution
    const plan = await masterAgentPlan(message, language)

    steps.push({
      agent: 'master',
      thinking: `사용자 의도 분석: "${plan.intent}"`,
      content: `**실행 계획:**\n${plan.agents.map(a => `→ ${a.charAt(0).toUpperCase() + a.slice(1)} Agent`).join('\n')}`
    })

    // Step 2: Execute each agent's tasks
    const agentResults: { agent: string; result: string }[] = []

    for (const task of plan.tasks) {
      let execution: { thinking: string; result: string }

      switch (task.agent) {
        case 'database':
          execution = await databaseAgentExecute(task.task, task.params)
          steps.push({
            agent: 'database',
            thinking: execution.thinking,
            content: execution.result
          })
          agentResults.push({ agent: 'database', result: execution.result })
          break

        case 'synthesis':
          execution = await synthesisAgentExecute(task.task, task.params)
          steps.push({
            agent: 'synthesis',
            thinking: execution.thinking,
            content: execution.result
          })
          agentResults.push({ agent: 'synthesis', result: execution.result })
          break

        case 'compute':
          execution = await computeAgentExecute(task.task, task.params)
          steps.push({
            agent: 'compute',
            thinking: execution.thinking,
            content: execution.result
          })
          agentResults.push({ agent: 'compute', result: execution.result })
          break
      }
    }

    // Step 3: Master Agent synthesizes the final response
    if (agentResults.length > 0) {
      const synthesis = await masterAgentSynthesize(message, agentResults, language)
      steps.push({
        agent: 'master',
        thinking: '결과 종합 중...',
        content: synthesis
      })
    }

    return NextResponse.json({ steps })
  } catch (error) {
    console.error('Lab API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', steps: [] },
      { status: 500 }
    )
  }
}
