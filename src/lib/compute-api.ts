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


// ============ MLIP (UPET) Functions ============

interface MLIPEnergyResult {
  success: boolean
  formula: string
  n_atoms: number
  total_energy_eV: number
  energy_per_atom_eV: number
  max_force_eV_A: number
  model: string
  note: string
}

interface MLIPFormationEnergyResult {
  success: boolean
  formula: string
  n_atoms: number
  total_energy_eV: number
  reference_energy_eV: number
  formation_energy_eV: number
  formation_energy_per_atom_eV: number
  stability_estimate: string
  model: string
  note: string
  error?: string
}

interface MLIPRelaxResult {
  success: boolean
  converged: boolean
  n_steps: number
  formula: string
  initial_energy_eV: number
  final_energy_eV: number
  energy_change_eV: number
  max_force_eV_A: number
  lattice: {
    a: number
    b: number
    c: number
    alpha: number
    beta: number
    gamma: number
    volume: number
  }
  relaxed_cif: string
  model: string
}

interface MLIPStatusResult {
  available: boolean
  model?: string
  version?: string
  theory_level?: string
  capabilities?: string[]
  message?: string
  install_command?: string
}

export async function checkMLIPStatus(): Promise<MLIPStatusResult> {
  try {
    const response = await fetch(`${COMPUTE_API}/mlip/status`)
    if (!response.ok) {
      return { available: false, message: 'MLIP endpoint not available' }
    }
    return await response.json()
  } catch {
    return { available: false, message: 'Compute server not running' }
  }
}

export async function calculateEnergy(materialId: string): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/mlip/energy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: materialId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return `에너지 계산 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as MLIPEnergyResult
    return [
      `## ⚡ MLIP 에너지 계산: ${result.formula}`,
      '',
      `### 결과`,
      `- 총 에너지: **${result.total_energy_eV} eV**`,
      `- 원자당 에너지: **${result.energy_per_atom_eV} eV/atom**`,
      `- 원자 수: ${result.n_atoms}`,
      `- 최대 힘: ${result.max_force_eV_A} eV/Å`,
      '',
      `### 모델 정보`,
      `- 사용 모델: ${result.model}`,
      '',
      `> ${result.note}`,
    ].join('\n')
  } catch (error) {
    return `MLIP 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function calculateFormationEnergy(materialId: string): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/mlip/formation-energy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: materialId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return `Formation energy 계산 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as MLIPFormationEnergyResult

    if (!result.success) {
      return `Formation energy 계산 실패: ${result.error}`
    }

    const stabilityEmoji = result.stability_estimate === 'likely stable' ? '✅' :
                          result.stability_estimate === 'metastable' ? '⚠️' : '❌'

    return [
      `## 🔬 Formation Energy: ${result.formula}`,
      '',
      `### 에너지 분해`,
      `- 화합물 에너지: ${result.total_energy_eV} eV`,
      `- 원소 기준 에너지: ${result.reference_energy_eV} eV`,
      `- **Formation Energy: ${result.formation_energy_eV} eV**`,
      `- **원자당: ${result.formation_energy_per_atom_eV} eV/atom**`,
      '',
      `### 안정성 예측`,
      `${stabilityEmoji} **${result.stability_estimate}**`,
      '',
      result.formation_energy_per_atom_eV < 0
        ? '> 음의 formation energy = 발열 반응, 열역학적으로 유리'
        : '> 양의 formation energy = 흡열 반응, 분해 가능성 있음',
      '',
      `### 모델 정보`,
      `- ${result.model}`,
    ].join('\n')
  } catch (error) {
    return `MLIP 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function relaxStructure(materialId: string): Promise<string> {
  try {
    const response = await fetch(`${COMPUTE_API}/mlip/relax`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: materialId, fmax: 0.05, steps: 100 }),
    })

    if (!response.ok) {
      const error = await response.json()
      return `구조 최적화 오류: ${error.detail || response.statusText}`
    }

    const result = await response.json() as MLIPRelaxResult

    return [
      `## 🔄 구조 최적화 (Relaxation): ${result.formula}`,
      '',
      `### 수렴 정보`,
      `- 수렴 여부: ${result.converged ? '✅ 수렴됨' : '⚠️ 미수렴'}`,
      `- 최적화 단계: ${result.n_steps} steps`,
      '',
      `### 에너지 변화`,
      `- 초기 에너지: ${result.initial_energy_eV} eV`,
      `- 최종 에너지: ${result.final_energy_eV} eV`,
      `- 에너지 변화: **${result.energy_change_eV} eV**`,
      `- 최대 힘: ${result.max_force_eV_A} eV/Å`,
      '',
      `### 최적화된 격자`,
      `- a = ${result.lattice.a} Å, b = ${result.lattice.b} Å, c = ${result.lattice.c} Å`,
      `- α = ${result.lattice.alpha}°, β = ${result.lattice.beta}°, γ = ${result.lattice.gamma}°`,
      `- 부피: ${result.lattice.volume} Å³`,
      '',
      `### 모델`,
      `- ${result.model}`,
    ].join('\n')
  } catch (error) {
    return `MLIP 서버 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
