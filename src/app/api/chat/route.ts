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
import {
  analyzeMaterial,
  convertStructure,
  getPhaseDiagram,
  getElementInfo,
} from '@/lib/compute-api'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  // Materials Project Tools
  {
    type: 'function',
    function: {
      name: 'mp_search',
      description: '[Materials Project] 화학식으로 재료를 검색합니다. 가장 포괄적인 DFT 계산 데이터베이스입니다.',
      parameters: {
        type: 'object',
        properties: {
          formula: { type: 'string', description: '화학식 (예: Fe2O3, SiO2, IrPt)' },
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
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열 (예: ["Li", "Co", "O"])' },
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
      description: '[Materials Project] Band gap 범위로 재료 검색. 반도체/절연체 찾기에 유용.',
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
      description: '[Materials Project] 열역학적으로 안정한 재료만 검색. 합성 가능성이 높은 재료.',
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
      description: '[AFLOW] 화학식으로 재료 검색. 3.5M+ 엔트리의 대규모 DFT 데이터베이스.',
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
      description: '[OQMD] 화학식으로 재료 검색. 열역학 데이터와 안정성 분석에 특화.',
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
      description: '[OQMD] 안정한 재료만 검색 (energy above hull ≈ 0).',
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
      description: '[COD] 화학식으로 결정구조 검색. 실험적으로 측정된 결정구조 데이터 (CIF 파일 제공).',
      parameters: {
        type: 'object',
        properties: {
          formula: { type: 'string', description: '화학식 (예: SiO2, Fe2O3)' },
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
      description: '[COD] Space group으로 결정구조 검색. 특정 대칭성을 가진 구조 찾기.',
      parameters: {
        type: 'object',
        properties: {
          space_group: { type: 'string', description: 'Space group 기호 (예: Fm-3m, P21/c)' },
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
          cod_id: { type: 'string', description: 'COD ID (예: 1000041)' },
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
      description: '모든 데이터베이스(Materials Project, AFLOW, OQMD, COD)에서 동시에 검색. 포괄적인 결과를 원할 때 사용.',
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
  // Computational Tools (Pymatgen/ASE)
  {
    type: 'function',
    function: {
      name: 'compute_analyze_structure',
      description: '[Pymatgen] Materials Project ID로 구조 분석. 대칭성, 결합길이, 배위수 등을 계산.',
      parameters: {
        type: 'object',
        properties: {
          material_id: { type: 'string', description: 'Materials Project ID (예: mp-149)' },
        },
        required: ['material_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compute_phase_diagram',
      description: '[Pymatgen] 2-4개 원소의 phase diagram 계산. 안정 상과 분해 반응 분석.',
      parameters: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' }, description: '원소 배열 (2-4개, 예: ["Li", "Fe", "O"])' },
        },
        required: ['elements'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compute_convert_structure',
      description: '[Pymatgen] 구조 파일 포맷 변환 (CIF ↔ POSCAR ↔ XYZ).',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '변환할 구조 파일 내용' },
          from_format: { type: 'string', description: '원본 포맷 (cif, poscar, xyz)' },
          to_format: { type: 'string', description: '변환할 포맷 (cif, poscar, xyz)' },
        },
        required: ['content', 'from_format', 'to_format'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compute_element_info',
      description: '[Pymatgen] 원소의 상세 정보 조회 (원자량, 전기음성도, 산화수 등).',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: '원소 기호 (예: Fe, Si, O)' },
        },
        required: ['symbol'],
      },
    },
  },
]

async function executeFunction(name: string, args: Record<string, unknown>): Promise<string> {
  const limit = (args.limit as number) || 5

  switch (name) {
    // Materials Project
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

    // AFLOW
    case 'aflow_search':
      return searchAflow(args.formula as string, limit)
    case 'aflow_search_elements':
      return searchAflowByElements(args.elements as string[], limit)
    case 'aflow_search_bandgap':
      return searchAflowByBandGap(args.min_gap as number, args.max_gap as number, limit)

    // OQMD
    case 'oqmd_search':
      return searchOqmd(args.formula as string, limit)
    case 'oqmd_search_elements':
      return searchOqmdByElements(args.elements as string[], limit)
    case 'oqmd_search_stable':
      return searchOqmdStable(args.elements as string[], limit)

    // COD
    case 'cod_search':
      return searchCod(args.formula as string, limit)
    case 'cod_search_elements':
      return searchCodByElements(args.elements as string[], limit)
    case 'cod_search_spacegroup':
      return searchCodBySpaceGroup(args.space_group as string, limit)
    case 'cod_get_entry':
      return getCodEntry(args.cod_id as string)

    // Computational (Pymatgen/ASE)
    case 'compute_analyze_structure':
      return analyzeMaterial(args.material_id as string)
    case 'compute_phase_diagram':
      return getPhaseDiagram(args.elements as string[])
    case 'compute_convert_structure':
      return convertStructure(args.content as string, args.from_format as string, args.to_format as string)
    case 'compute_element_info':
      return getElementInfo(args.symbol as string)

    // Multi-database
    case 'search_all_databases': {
      const formula = args.formula as string
      const perDbLimit = (args.limit as number) || 3
      const [mpResult, aflowResult, oqmdResult, codResult] = await Promise.all([
        searchMaterials(formula, perDbLimit),
        searchAflow(formula, perDbLimit),
        searchOqmd(formula, perDbLimit),
        searchCod(formula, perDbLimit),
      ])
      return `## 통합 검색 결과: "${formula}"\n\n### Materials Project\n${mpResult}\n\n---\n\n### AFLOW\n${aflowResult}\n\n---\n\n### OQMD\n${oqmdResult}\n\n---\n\n### COD (결정구조)\n${codResult}`
    }

    default:
      return `알 수 없는 함수: ${name}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const systemMessage = {
      role: 'system' as const,
      content: `당신은 Materials Science 전문 AI 어시스턴트입니다.

## 데이터베이스 (4개)
1. **Materials Project** - 150,000+ 무기 화합물, DFT 계산 데이터
2. **AFLOW** - 3,500,000+ 엔트리, high-throughput 계산
3. **OQMD** - 1,000,000+ 엔트리, 열역학 안정성 분석
4. **COD** - 500,000+ 실험 결정구조, CIF 파일

## Computational Tools (Pymatgen/ASE)
- **compute_analyze_structure**: 구조 분석 (대칭성, 결합길이, 배위수)
- **compute_phase_diagram**: Phase diagram 계산 (2-4원소)
- **compute_convert_structure**: 포맷 변환 (CIF↔POSCAR↔XYZ)
- **compute_element_info**: 원소 정보 조회

## 사용 가이드
- 데이터 검색: Materials Project 우선, 필요시 search_all_databases
- 구조 분석이 필요하면: compute_analyze_structure 사용
- Phase diagram 요청 시: compute_phase_diagram 사용
- 원소 정보 질문: compute_element_info 사용

항상 한국어로 답변하고, 결과를 이해하기 쉽게 설명해주세요.
Computational 기능은 Python 서버(port 8000)가 실행 중이어야 합니다.`,
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...messages],
      tools: tools,
      tool_choice: 'auto',
    })

    let assistantMessage = response.choices[0].message

    // Handle function calls (allow multiple rounds)
    let iterations = 0
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 5) {
      iterations++

      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments)
          const result = await executeFunction(toolCall.function.name, args)
          return {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: result,
          }
        })
      )

      const followUpResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          systemMessage,
          ...messages,
          assistantMessage,
          ...toolResults,
        ],
        tools: tools,
        tool_choice: 'auto',
      })

      assistantMessage = followUpResponse.choices[0].message
    }

    return NextResponse.json({
      message: assistantMessage.content,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
