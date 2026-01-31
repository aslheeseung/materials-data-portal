import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  searchMaterials,
  searchByElements,
  getMaterial,
  searchByBandGap,
  searchStableMaterials,
} from '@/lib/materials-api'
import {
  searchAflow,
  searchAflowByElements,
  searchAflowByBandGap,
} from '@/lib/aflow-api'
import {
  searchOqmd,
  searchOqmdByElements,
  searchOqmdStable,
} from '@/lib/oqmd-api'
import {
  searchCod,
  searchCodByElements,
  searchCodBySpaceGroup,
  getCodEntry,
} from '@/lib/cod-api'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const searchTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  // Materials Project Tools
  {
    type: 'function',
    function: {
      name: 'mp_search',
      description: '[Materials Project] 화학식으로 재료를 검색합니다.',
      parameters: {
        type: 'object',
        properties: {
          formula: { type: 'string', description: '화학식 (예: Fe2O3, SiO2)' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['formula'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mp_search_elements',
      description: '[Materials Project] 특정 원소 조합의 모든 재료를 검색합니다.',
      parameters: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['elements'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mp_get_material',
      description: '[Materials Project] material_id로 상세 정보 조회',
      parameters: {
        type: 'object',
        properties: {
          material_id: { type: 'string', description: 'Materials Project ID (예: mp-1234)' },
        },
        required: ['material_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mp_search_bandgap',
      description: '[Materials Project] Band gap 범위로 재료 검색.',
      parameters: {
        type: 'object',
        properties: {
          min_gap: { type: 'number', description: '최소 band gap (eV)' },
          max_gap: { type: 'number', description: '최대 band gap (eV)' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['min_gap', 'max_gap'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mp_search_stable',
      description: '[Materials Project] 열역학적으로 안정한 재료만 검색.',
      parameters: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['elements'],
      },
    },
  },
  // AFLOW Tools
  {
    type: 'function',
    function: {
      name: 'aflow_search',
      description: '[AFLOW] 화학식으로 재료 검색. 3.5M+ 엔트리.',
      parameters: {
        type: 'object',
        properties: {
          formula: { type: 'string', description: '화학식' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['formula'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'aflow_search_elements',
      description: '[AFLOW] 특정 원소 조합의 재료 검색.',
      parameters: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['elements'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'aflow_search_bandgap',
      description: '[AFLOW] Band gap 범위로 재료 검색.',
      parameters: {
        type: 'object',
        properties: {
          min_gap: { type: 'number', description: '최소 band gap (eV)' },
          max_gap: { type: 'number', description: '최대 band gap (eV)' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['min_gap', 'max_gap'],
      },
    },
  },
  // OQMD Tools
  {
    type: 'function',
    function: {
      name: 'oqmd_search',
      description: '[OQMD] 화학식으로 재료 검색. 열역학 안정성 분석.',
      parameters: {
        type: 'object',
        properties: {
          formula: { type: 'string', description: '화학식' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['formula'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'oqmd_search_elements',
      description: '[OQMD] 특정 원소 조합의 재료 검색.',
      parameters: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['elements'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'oqmd_search_stable',
      description: '[OQMD] 안정한 재료만 검색.',
      parameters: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['elements'],
      },
    },
  },
  // COD Tools
  {
    type: 'function',
    function: {
      name: 'cod_search',
      description: '[COD] 화학식으로 결정구조 검색. 실험 데이터.',
      parameters: {
        type: 'object',
        properties: {
          formula: { type: 'string', description: '화학식' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['formula'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cod_search_elements',
      description: '[COD] 특정 원소 조합의 결정구조 검색.',
      parameters: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['elements'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cod_search_spacegroup',
      description: '[COD] Space group으로 결정구조 검색.',
      parameters: {
        type: 'object',
        properties: {
          space_group: { type: 'string', description: 'Space group 기호 (예: Fm-3m)' },
          limit: { type: 'number', description: '최대 결과 수 (기본값: 5)' },
        },
        required: ['space_group'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cod_get_entry',
      description: '[COD] COD ID로 결정구조 상세 정보 조회.',
      parameters: {
        type: 'object',
        properties: {
          cod_id: { type: 'string', description: 'COD ID' },
        },
        required: ['cod_id'],
      },
    },
  },
  // Multi-database search
  {
    type: 'function',
    function: {
      name: 'search_all_databases',
      description: '모든 데이터베이스에서 동시에 검색.',
      parameters: {
        type: 'object',
        properties: {
          formula: { type: 'string', description: '화학식' },
          limit: { type: 'number', description: '각 DB당 최대 결과 수 (기본값: 3)' },
        },
        required: ['formula'],
      },
    },
  },
]

async function executeSearchFunction(name: string, args: Record<string, unknown>): Promise<string> {
  const limit = (args.limit as number) || 5

  switch (name) {
    case 'mp_search':
      return searchMaterials(args.formula as string, limit)
    case 'mp_search_elements':
      return searchByElements(args.elements as string[], limit)
    case 'mp_get_material':
      return getMaterial(args.material_id as string)
    case 'mp_search_bandgap':
      return searchByBandGap(args.min_gap as number, args.max_gap as number, limit)
    case 'mp_search_stable':
      return searchStableMaterials(args.elements as string[], limit)
    case 'aflow_search':
      return searchAflow(args.formula as string, limit)
    case 'aflow_search_elements':
      return searchAflowByElements(args.elements as string[], limit)
    case 'aflow_search_bandgap':
      return searchAflowByBandGap(args.min_gap as number, args.max_gap as number, limit)
    case 'oqmd_search':
      return searchOqmd(args.formula as string, limit)
    case 'oqmd_search_elements':
      return searchOqmdByElements(args.elements as string[], limit)
    case 'oqmd_search_stable':
      return searchOqmdStable(args.elements as string[], limit)
    case 'cod_search':
      return searchCod(args.formula as string, limit)
    case 'cod_search_elements':
      return searchCodByElements(args.elements as string[], limit)
    case 'cod_search_spacegroup':
      return searchCodBySpaceGroup(args.space_group as string, limit)
    case 'cod_get_entry':
      return getCodEntry(args.cod_id as string)
    case 'search_all_databases': {
      const formula = args.formula as string
      const perDbLimit = (args.limit as number) || 3
      const [mpResult, aflowResult, oqmdResult, codResult] = await Promise.all([
        searchMaterials(formula, perDbLimit),
        searchAflow(formula, perDbLimit),
        searchOqmd(formula, perDbLimit),
        searchCod(formula, perDbLimit),
      ])
      return `## 통합 검색: "${formula}"\n\n### Materials Project\n${mpResult}\n\n---\n\n### AFLOW\n${aflowResult}\n\n---\n\n### OQMD\n${oqmdResult}\n\n---\n\n### COD\n${codResult}`
    }
    default:
      return `알 수 없는 함수: ${name}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'ko' } = await request.json()

    const langInstruction = language === 'en'
      ? 'Always respond in English. Explain results clearly.'
      : '항상 한국어로 답변하고, 결과를 이해하기 쉽게 설명해주세요.'

    const systemMessage = {
      role: 'system' as const,
      content: `You are a Materials Science database search expert AI.

## Available Databases
1. **Materials Project** - 150,000+ DFT calculations
2. **AFLOW** - 3,500,000+ high-throughput calculations
3. **OQMD** - 1,000,000+ thermodynamic data
4. **COD** - 500,000+ experimental crystal structures

## Search Tips
- Comprehensive search: use search_all_databases
- Specific DB search: mp_search, aflow_search, oqmd_search, cod_search
- Band gap search: mp_search_bandgap, aflow_search_bandgap
- Stable materials: mp_search_stable, oqmd_search_stable

${langInstruction}`,
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...messages],
      tools: searchTools,
      tool_choice: 'auto',
    })

    let assistantMessage = response.choices[0].message
    let iterations = 0

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 5) {
      iterations++

      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const func = (toolCall as { function: { name: string; arguments: string } }).function
          const args = JSON.parse(func.arguments)
          const result = await executeSearchFunction(func.name, args)
          return {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: result,
          }
        })
      )

      const followUpResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [systemMessage, ...messages, assistantMessage, ...toolResults],
        tools: searchTools,
        tool_choice: 'auto',
      })

      assistantMessage = followUpResponse.choices[0].message
    }

    return NextResponse.json({ message: assistantMessage.content })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
