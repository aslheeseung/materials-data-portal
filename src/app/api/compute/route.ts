import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  analyzeMaterial,
  analyzeCif,
  convertStructure,
  getPhaseDiagram,
  getElementInfo,
  checkComputeServer,
} from '@/lib/compute-api'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const computeTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'analyze_material',
      description: 'Materials Project ID로 구조 분석. 대칭성, 결합길이, 배위수, 격자 파라미터 등을 계산.',
      parameters: {
        type: 'object',
        properties: {
          material_id: { type: 'string', description: 'Materials Project ID (예: mp-149, mp-2534)' },
        },
        required: ['material_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_cif',
      description: 'CIF 파일 내용으로 구조 분석. 대칭성, 결합길이, 배위수 등을 계산.',
      parameters: {
        type: 'object',
        properties: {
          cif_content: { type: 'string', description: 'CIF 파일 내용' },
        },
        required: ['cif_content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'phase_diagram',
      description: '2-4개 원소의 phase diagram 계산. 안정 상과 불안정 상의 분해 반응을 분석.',
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
      name: 'convert_structure',
      description: '구조 파일 포맷 변환 (CIF ↔ POSCAR ↔ XYZ).',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '변환할 구조 파일 내용' },
          from_format: { type: 'string', enum: ['cif', 'poscar', 'xyz'], description: '원본 포맷' },
          to_format: { type: 'string', enum: ['cif', 'poscar', 'xyz'], description: '변환할 포맷' },
        },
        required: ['content', 'from_format', 'to_format'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'element_info',
      description: '원소의 상세 정보 조회 (원자량, 전기음성도, 전자 배치, 산화수 등).',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: '원소 기호 (예: Fe, Si, O, Li)' },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_server',
      description: 'Python 계산 서버 상태 확인.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]

async function executeComputeFunction(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'analyze_material':
      return analyzeMaterial(args.material_id as string)
    case 'analyze_cif':
      return analyzeCif(args.cif_content as string)
    case 'phase_diagram':
      return getPhaseDiagram(args.elements as string[])
    case 'convert_structure':
      return convertStructure(args.content as string, args.from_format as string, args.to_format as string)
    case 'element_info':
      return getElementInfo(args.symbol as string)
    case 'check_server': {
      const isHealthy = await checkComputeServer()
      return isHealthy
        ? '✅ Python 계산 서버가 정상 작동 중입니다 (http://localhost:8000)'
        : '❌ Python 계산 서버에 연결할 수 없습니다. 서버를 시작해주세요.'
    }
    default:
      return `알 수 없는 함수: ${name}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'ko' } = await request.json()

    const langInstruction = language === 'en'
      ? 'Always respond in English. Explain results in detail.'
      : '항상 한국어로 답변하고, 결과를 상세히 설명해주세요.'

    const systemMessage = {
      role: 'system' as const,
      content: `You are a Materials Science Computation expert AI.
You provide computational features using Pymatgen and ASE.

## Available Features

### 1. Structure Analysis (analyze_material, analyze_cif)
- Space group, Crystal system, Point group
- Lattice parameters (a, b, c, α, β, γ)
- Coordination Number
- Bond Length
- Density, Volume

### 2. Phase Diagram (phase_diagram)
- 2-4 element systems
- Stable phases
- Decomposition reactions of unstable phases
- Formation energy

### 3. Format Conversion (convert_structure)
- CIF ↔ POSCAR ↔ XYZ
- Compatible with VASP, Quantum ESPRESSO, etc.

### 4. Element Info (element_info)
- Atomic mass, Atomic number
- Electronegativity
- Electronic configuration
- Oxidation states
- Metal/Non-metal classification

## Usage Examples
- "Analyze mp-149 structure" → analyze_material
- "Draw Li-Co-O phase diagram" → phase_diagram
- "Show Fe element info" → element_info
- "Convert this CIF to POSCAR" → convert_structure

${langInstruction}
Python server (port 8000) is required.`,
    }

    // Check if compute server is available
    const serverHealthy = await checkComputeServer()
    if (!serverHealthy) {
      const message = language === 'en'
        ? '⚠️ Cannot connect to Python computation server.\n\nTo start the server:\n```bash\ncd python-server\npython -m uvicorn main:app --port 8000\n```\n\nPlease try again after starting the server.'
        : '⚠️ Python 계산 서버에 연결할 수 없습니다.\n\n서버 시작 방법:\n```bash\ncd python-server\npython -m uvicorn main:app --port 8000\n```\n\n서버 시작 후 다시 시도해주세요.'
      return NextResponse.json({ message })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...messages],
      tools: computeTools,
      tool_choice: 'auto',
    })

    let assistantMessage = response.choices[0].message
    let iterations = 0

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 5) {
      iterations++

      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments)
          const result = await executeComputeFunction(toolCall.function.name, args)
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
        tools: computeTools,
        tool_choice: 'auto',
      })

      assistantMessage = followUpResponse.choices[0].message
    }

    return NextResponse.json({ message: assistantMessage.content })
  } catch (error) {
    console.error('Compute API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
