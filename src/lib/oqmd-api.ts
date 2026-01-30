// OQMD API Client
// Documentation: https://oqmd.org/documentation/

const OQMD_API = 'https://oqmd.org/oqmdapi'

interface OqmdEntry {
  entry_id: number
  name: string
  composition: string
  composition_generic: string
  prototype: string
  spacegroup: string
  ntypes: number
  natoms: number
  volume: number
  delta_e: number  // formation energy
  stability: number  // energy above hull
  band_gap: number
  sites: string[]
}

interface OqmdResponse {
  links: {
    next: string | null
    previous: string | null
  }
  resource: object
  data: OqmdEntry[]
  meta: {
    query: object
    api_version: string
    time_stamp: string
    data_returned: number
    data_available: number
  }
  response_message: string
}

function formatOqmdEntry(entry: OqmdEntry): string {
  const lines = [
    `**${entry.name || entry.composition}** (OQMD #${entry.entry_id})`,
    `- 조성: ${entry.composition}`,
    `- Generic: ${entry.composition_generic || 'N/A'}`,
    `- Prototype: ${entry.prototype || 'N/A'}`,
    `- Space Group: ${entry.spacegroup || 'N/A'}`,
  ]

  if (entry.delta_e !== undefined && entry.delta_e !== null) {
    lines.push(`- Formation Energy: ${entry.delta_e.toFixed(4)} eV/atom`)
  }
  if (entry.stability !== undefined && entry.stability !== null) {
    const stable = entry.stability < 0.001 ? '(안정)' : '(불안정)'
    lines.push(`- Energy Above Hull: ${entry.stability.toFixed(4)} eV/atom ${stable}`)
  }
  if (entry.band_gap !== undefined && entry.band_gap !== null && entry.band_gap > 0) {
    lines.push(`- Band Gap: ${entry.band_gap.toFixed(3)} eV`)
  }
  if (entry.volume !== undefined && entry.volume !== null) {
    lines.push(`- Volume: ${entry.volume.toFixed(3)} Å³`)
  }
  lines.push(`- [OQMD 링크](https://oqmd.org/analysis/calculation/${entry.entry_id})`)

  return lines.join('\n')
}

export async function searchOqmd(formula: string, limit: number = 10): Promise<string> {
  try {
    const url = `${OQMD_API}/formationenergy?composition=${encodeURIComponent(formula)}&limit=${limit}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`OQMD API error: ${response.status}`)
    }

    const result = await response.json() as OqmdResponse

    if (!result.data || result.data.length === 0) {
      return `OQMD에서 "${formula}"에 해당하는 재료를 찾지 못했습니다.`
    }

    const formatted = result.data.slice(0, limit).map(formatOqmdEntry).join('\n\n')
    return `[OQMD] "${formula}" 검색 결과 (${Math.min(result.data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `OQMD 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchOqmdByElements(elements: string[], limit: number = 10): Promise<string> {
  try {
    // OQMD uses element_set for searching by elements
    const elementSet = elements.join('-')
    const url = `${OQMD_API}/formationenergy?element_set=${encodeURIComponent(elementSet)}&limit=${limit}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`OQMD API error: ${response.status}`)
    }

    const result = await response.json() as OqmdResponse

    if (!result.data || result.data.length === 0) {
      return `OQMD에서 ${elements.join('-')} 시스템의 재료를 찾지 못했습니다.`
    }

    const formatted = result.data.slice(0, limit).map(formatOqmdEntry).join('\n\n')
    return `[OQMD] ${elements.join('-')} 시스템 검색 결과 (${Math.min(result.data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `OQMD 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchOqmdStable(elements: string[], limit: number = 10): Promise<string> {
  try {
    const elementSet = elements.join('-')
    // stability < 0.001 means on the convex hull (stable)
    const url = `${OQMD_API}/formationenergy?element_set=${encodeURIComponent(elementSet)}&stability__lt=0.001&limit=${limit}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`OQMD API error: ${response.status}`)
    }

    const result = await response.json() as OqmdResponse

    if (!result.data || result.data.length === 0) {
      return `OQMD에서 ${elements.join('-')} 시스템의 안정한 재료를 찾지 못했습니다.`
    }

    const formatted = result.data.slice(0, limit).map(formatOqmdEntry).join('\n\n')
    return `[OQMD] ${elements.join('-')} 시스템의 안정한 재료 (${Math.min(result.data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `OQMD 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
