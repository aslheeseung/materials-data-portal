// AFLOW API Client
// Documentation: https://aflow.org/API/aflux/

const AFLOW_API = 'https://aflow.org/API/aflux/v1.0'

interface AflowEntry {
  auid: string
  compound: string
  prototype: string
  nspecies: number
  species: string[]
  natoms: number
  volume_cell: number
  volume_atom: number
  density: number
  spacegroup_orig: number
  spacegroup_relax: number
  Bravais_lattice_orig: string
  Bravais_lattice_relax: string
  enthalpy_formation_atom: number
  enthalpy_atom: number
  energy_atom: number
  Egap: number
  Egap_type: string
  spin_atom: number
  spinD: number[]
}

function formatAflowEntry(entry: AflowEntry): string {
  const lines = [
    `**${entry.compound}** (${entry.auid})`,
    `- 원소: ${entry.species?.join(', ') || 'N/A'}`,
    `- Prototype: ${entry.prototype || 'N/A'}`,
    `- Space Group: ${entry.spacegroup_relax || entry.spacegroup_orig || 'N/A'}`,
    `- Bravais Lattice: ${entry.Bravais_lattice_relax || entry.Bravais_lattice_orig || 'N/A'}`,
  ]

  if (entry.Egap !== undefined && entry.Egap !== null) {
    lines.push(`- Band Gap: ${entry.Egap.toFixed(3)} eV (${entry.Egap_type || 'N/A'})`)
  }
  if (entry.enthalpy_formation_atom !== undefined && entry.enthalpy_formation_atom !== null) {
    lines.push(`- Formation Enthalpy: ${entry.enthalpy_formation_atom.toFixed(4)} eV/atom`)
  }
  if (entry.density !== undefined && entry.density !== null) {
    lines.push(`- 밀도: ${entry.density.toFixed(3)} g/cm³`)
  }
  if (entry.volume_atom !== undefined && entry.volume_atom !== null) {
    lines.push(`- Volume/atom: ${entry.volume_atom.toFixed(3)} Å³`)
  }
  lines.push(`- [AFLOW 링크](https://aflow.org/material/?id=${entry.auid})`)

  return lines.join('\n')
}

export async function searchAflow(formula: string, limit: number = 10): Promise<string> {
  try {
    // AFLUX query format
    const query = `?compound('${formula}'),paging(1,${limit})`
    const url = `${AFLOW_API}/${query},format(json)`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`AFLOW API error: ${response.status}`)
    }

    const data = await response.json() as AflowEntry[]

    if (!data || data.length === 0) {
      return `AFLOW에서 "${formula}"에 해당하는 재료를 찾지 못했습니다.`
    }

    const formatted = data.slice(0, limit).map(formatAflowEntry).join('\n\n')
    return `[AFLOW] "${formula}" 검색 결과 (${Math.min(data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `AFLOW 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchAflowByElements(elements: string[], limit: number = 10): Promise<string> {
  try {
    // Search by species
    const speciesQuery = elements.map(e => `species('${e}')`).join(',')
    const query = `?${speciesQuery},nspecies(${elements.length}),paging(1,${limit})`
    const url = `${AFLOW_API}/${query},format(json)`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`AFLOW API error: ${response.status}`)
    }

    const data = await response.json() as AflowEntry[]

    if (!data || data.length === 0) {
      return `AFLOW에서 ${elements.join('-')} 시스템의 재료를 찾지 못했습니다.`
    }

    const formatted = data.slice(0, limit).map(formatAflowEntry).join('\n\n')
    return `[AFLOW] ${elements.join('-')} 시스템 검색 결과 (${Math.min(data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `AFLOW 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchAflowByBandGap(minGap: number, maxGap: number, limit: number = 10): Promise<string> {
  try {
    const query = `?Egap(${minGap}*,*${maxGap}),paging(1,${limit})`
    const url = `${AFLOW_API}/${query},format(json)`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`AFLOW API error: ${response.status}`)
    }

    const data = await response.json() as AflowEntry[]

    if (!data || data.length === 0) {
      return `AFLOW에서 band gap ${minGap}~${maxGap} eV 범위의 재료를 찾지 못했습니다.`
    }

    const formatted = data.slice(0, limit).map(formatAflowEntry).join('\n\n')
    return `[AFLOW] Band gap ${minGap}~${maxGap} eV 검색 결과 (${Math.min(data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `AFLOW 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
