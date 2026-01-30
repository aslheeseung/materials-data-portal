const BASE_URL = 'https://api.materialsproject.org'
const API_KEY = process.env.MP_API_KEY || ''

interface Material {
  material_id: string
  formula_pretty: string
  elements: string[]
  nelements: number
  nsites: number
  volume: number
  density: number
  symmetry?: {
    crystal_system: string
    symbol: string
    number: number
  }
  formation_energy_per_atom?: number
  energy_above_hull?: number
  is_stable?: boolean
  band_gap?: number
  is_metal?: boolean
  is_magnetic?: boolean
  theoretical?: boolean
}

interface SearchResult {
  data: Material[]
  meta: {
    total_doc: number
  }
}

async function fetchMP<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    headers: {
      'X-API-KEY': API_KEY,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Materials Project API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function formatMaterial(m: Material): string {
  const lines = [
    `**${m.formula_pretty}** (${m.material_id})`,
    `- 원소: ${m.elements.join(', ')}`,
    `- 결정계: ${m.symmetry?.crystal_system || 'N/A'} (${m.symmetry?.symbol || 'N/A'})`,
  ]

  if (m.band_gap !== undefined) {
    lines.push(`- Band Gap: ${m.band_gap.toFixed(3)} eV ${m.is_metal ? '(금속)' : ''}`)
  }
  if (m.formation_energy_per_atom !== undefined) {
    lines.push(`- Formation Energy: ${m.formation_energy_per_atom.toFixed(4)} eV/atom`)
  }
  if (m.energy_above_hull !== undefined) {
    lines.push(`- Energy Above Hull: ${m.energy_above_hull.toFixed(4)} eV/atom ${m.is_stable ? '(안정)' : '(불안정)'}`)
  }
  if (m.is_magnetic !== undefined) {
    lines.push(`- 자성: ${m.is_magnetic ? '있음' : '없음'}`)
  }
  if (m.density !== undefined) {
    lines.push(`- 밀도: ${m.density.toFixed(3)} g/cm³`)
  }
  lines.push(`- [Materials Project 링크](https://materialsproject.org/materials/${m.material_id})`)

  return lines.join('\n')
}

export async function searchMaterials(formula: string, limit: number = 10): Promise<string> {
  try {
    const result = await fetchMP<SearchResult>('/materials/summary/', {
      formula: formula,
      _limit: limit.toString(),
      _fields: 'material_id,formula_pretty,elements,nelements,nsites,volume,density,symmetry,formation_energy_per_atom,energy_above_hull,is_stable,band_gap,is_metal,is_magnetic,theoretical',
    })

    if (result.data.length === 0) {
      return `"${formula}"에 해당하는 재료를 찾지 못했습니다.`
    }

    const formatted = result.data.map(formatMaterial).join('\n\n')
    return `"${formula}" 검색 결과 (${result.data.length}개):\n\n${formatted}`
  } catch (error) {
    return `검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchByElements(elements: string[], limit: number = 10): Promise<string> {
  try {
    const chemsys = elements.sort().join('-')
    const result = await fetchMP<SearchResult>('/materials/summary/', {
      chemsys: chemsys,
      _limit: limit.toString(),
      _fields: 'material_id,formula_pretty,elements,nelements,nsites,volume,density,symmetry,formation_energy_per_atom,energy_above_hull,is_stable,band_gap,is_metal,is_magnetic,theoretical',
    })

    if (result.data.length === 0) {
      return `${elements.join('-')} 시스템에서 재료를 찾지 못했습니다.`
    }

    const formatted = result.data.map(formatMaterial).join('\n\n')
    return `${elements.join('-')} 시스템 검색 결과 (${result.data.length}개):\n\n${formatted}`
  } catch (error) {
    return `검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function getMaterial(materialId: string): Promise<string> {
  try {
    const result = await fetchMP<SearchResult>('/materials/summary/', {
      material_ids: materialId,
      _fields: 'material_id,formula_pretty,elements,nelements,nsites,volume,density,symmetry,formation_energy_per_atom,energy_above_hull,is_stable,band_gap,is_metal,is_magnetic,theoretical',
    })

    if (result.data.length === 0) {
      return `재료 ID "${materialId}"를 찾지 못했습니다.`
    }

    return `재료 상세 정보:\n\n${formatMaterial(result.data[0])}`
  } catch (error) {
    return `조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchByBandGap(minGap: number, maxGap: number, limit: number = 10): Promise<string> {
  try {
    const result = await fetchMP<SearchResult>('/materials/summary/', {
      band_gap_min: minGap.toString(),
      band_gap_max: maxGap.toString(),
      _limit: limit.toString(),
      _fields: 'material_id,formula_pretty,elements,band_gap,formation_energy_per_atom,is_stable,symmetry',
    })

    if (result.data.length === 0) {
      return `Band gap ${minGap}~${maxGap} eV 범위의 재료를 찾지 못했습니다.`
    }

    const formatted = result.data.map(formatMaterial).join('\n\n')
    return `Band gap ${minGap}~${maxGap} eV 검색 결과 (${result.data.length}개):\n\n${formatted}`
  } catch (error) {
    return `검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchStableMaterials(elements: string[], limit: number = 10): Promise<string> {
  try {
    const chemsys = elements.sort().join('-')
    const result = await fetchMP<SearchResult>('/materials/summary/', {
      chemsys: chemsys,
      is_stable: 'true',
      _limit: limit.toString(),
      _fields: 'material_id,formula_pretty,elements,band_gap,formation_energy_per_atom,energy_above_hull,symmetry',
    })

    if (result.data.length === 0) {
      return `${elements.join('-')} 시스템에서 안정한 재료를 찾지 못했습니다.`
    }

    const formatted = result.data.map(formatMaterial).join('\n\n')
    return `${elements.join('-')} 시스템의 안정한 재료 (${result.data.length}개):\n\n${formatted}`
  } catch (error) {
    return `검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
