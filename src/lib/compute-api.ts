// Computational API Client - connects to Python FastAPI server

const COMPUTE_API = process.env.COMPUTE_API_URL || 'http://localhost:8000'

interface AnalysisResult {
  formula: string
  num_sites: number
  volume: number
  density: number
  lattice: {
    a: number
    b: number
    c: number
    alpha: number
    beta: number
    gamma: number
    volume: number
  }
  symmetry: {
    space_group: string
    space_group_number: number
    crystal_system: string
    point_group: string
  }
  coordination: Array<{
    site: string
    coordination_number: number | string
    neighbors: string[]
  }>
  bond_lengths: Array<{
    bond: string
    length: number
  }>
  elements: string[]
}

interface ConversionResult {
  success: boolean
  from_format: string
  to_format: string
  formula: string
  output: string
}

interface PhaseDiagramResult {
  success: boolean
  elements: string[]
  num_entries: number
  num_stable: number
  stable_phases: Array<{
    formula: string
    energy_per_atom: number
  }>
  unstable_phases: Array<{
    formula: string
    energy_above_hull: number
    decomposition: string
  }>
  summary: string
}

interface ElementInfo {
  symbol: string
  name: string
  atomic_number: number
  atomic_mass: number
  electronic_structure: string
  group: number
  row: number
  block: string
  is_metal: boolean
  electronegativity: number | null
  oxidation_states: number[]
}

function formatAnalysisResult(result: AnalysisResult): string {
  const lines = [
    `## 구조 분석 결과: ${result.formula}`,
    '',
    `### 기본 정보`,
    `- 화학식: ${result.formula}`,
    `- 원자 수: ${result.num_sites}`,
    `- 부피: ${result.volume} Å³`,
    `- 밀도: ${result.density} g/cm³`,
    '',
    `### 격자 파라미터`,
    `- a = ${result.lattice.a} Å, b = ${result.lattice.b} Å, c = ${result.lattice.c} Å`,
    `- α = ${result.lattice.alpha}°, β = ${result.lattice.beta}°, γ = ${result.lattice.gamma}°`,
    '',
    `### 대칭성`,
    `- Space Group: ${result.symmetry.space_group} (#${result.symmetry.space_group_number})`,
    `- Crystal System: ${result.symmetry.crystal_system}`,
    `- Point Group: ${result.symmetry.point_group}`,
    '',
    `### 배위수 (Coordination)`,
  ]

  for (const coord of result.coordination.slice(0, 5)) {
    lines.push(`- ${coord.site}: CN = ${coord.coordination_number}`)
  }

  lines.push('')
  lines.push(`### 결합 길이 (상위 10개)`)

  for (const bond of result.bond_lengths.slice(0, 10)) {
    lines.push(`- ${bond.bond}: ${bond.length} Å`)
  }

  return lines.join('\n')
}

function formatPhaseDiagramResult(result: PhaseDiagramResult): string {
  const lines = [
    `## Phase Diagram: ${result.elements.join('-')} 시스템`,
    '',
    `### 요약`,
    `- 총 엔트리: ${result.num_entries}개`,
    `- 안정 상: ${result.num_stable}개`,
    '',
    `### 안정한 상 (Stable Phases)`,
  ]

  for (const phase of result.stable_phases) {
    lines.push(`- **${phase.formula}**: ${phase.energy_per_atom} eV/atom`)
  }

  lines.push('')
  lines.push(`### 불안정한 상 (Energy Above Hull 기준)`)

  for (const phase of result.unstable_phases.slice(0, 10)) {
    lines.push(`- ${phase.formula}: +${phase.energy_above_hull} eV/atom → ${phase.decomposition}`)
  }

  return lines.join('\n')
}

function formatElementInfo(el: ElementInfo): string {
  return [
    `## 원소 정보: ${el.name} (${el.symbol})`,
    '',
    `- 원자번호: ${el.atomic_number}`,
    `- 원자량: ${el.atomic_mass}`,
    `- 전자 배치: ${el.electronic_structure}`,
    `- 주기율표 위치: ${el.row}주기 ${el.group}족 (${el.block}-block)`,
    `- 금속 여부: ${el.is_metal ? '금속' : '비금속'}`,
    `- 전기음성도: ${el.electronegativity || 'N/A'}`,
    `- 산화수: ${el.oxidation_states.join(', ') || 'N/A'}`,
  ].join('\n')
}

export async function analyzeCif(cifString: string): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/analyze/cif`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cif_string: cifString }),
    })

    if (!response.ok) {
      const error = await response.json()
      return `CIF 분석 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as AnalysisResult
    return formatAnalysisResult(result)
  } catch (error) {
    return `계산 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}. Python 서버가 실행 중인지 확인하세요.`
  }
}

export async function analyzeMaterial(materialId: string): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/analyze/material`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: materialId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return `재료 분석 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as AnalysisResult
    return formatAnalysisResult(result)
  } catch (error) {
    return `계산 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function convertStructure(
  content: string,
  fromFormat: string,
  toFormat: string
): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        from_format: fromFormat,
        to_format: toFormat,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return `변환 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as ConversionResult
    return [
      `## 구조 변환 완료`,
      '',
      `- 화학식: ${result.formula}`,
      `- 변환: ${result.from_format.toUpperCase()} → ${result.to_format.toUpperCase()}`,
      '',
      '```',
      result.output,
      '```'
    ].join('\n')
  } catch (error) {
    return `계산 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function getPhaseDiagram(elements: string[]): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/phase-diagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ elements }),
    })

    if (!response.ok) {
      const error = await response.json()
      return `Phase diagram 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as PhaseDiagramResult

    if (!result.success) {
      return result.summary || 'Phase diagram 생성 실패'
    }

    return formatPhaseDiagramResult(result)
  } catch (error) {
    return `계산 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function getElementInfo(symbol: string): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/element/${symbol}`)

    if (!response.ok) {
      const error = await response.json()
      return `원소 정보 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as ElementInfo
    return formatElementInfo(result)
  } catch (error) {
    return `계산 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function checkComputeServer(): Promise<boolean> {
  try {
    const response = await fetch(`${COMPUTE_API}/health`)
    return response.ok
  } catch {
    return false
  }
}
