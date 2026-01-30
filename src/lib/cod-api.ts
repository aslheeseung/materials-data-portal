// COD (Crystallography Open Database) API Client
// Documentation: https://wiki.crystallography.net/RESTful_API/

const COD_API = 'https://www.crystallography.net/cod/result'

interface CodEntry {
  file: string  // COD ID
  formula: string
  calcformula?: string
  a: string
  b: string
  c: string
  alpha: string
  beta: string
  gamma: string
  vol: string
  sg: string  // space group
  sgHall: string
  sgNumber: string
  nel: string  // number of elements
  Z: string
  Zprime: string
  mineral?: string
  title?: string
  authors?: string
  journal?: string
  year?: string
  doi?: string
}

function formatCodEntry(entry: CodEntry): string {
  const a = parseFloat(entry.a)
  const b = parseFloat(entry.b)
  const c = parseFloat(entry.c)
  const alpha = parseFloat(entry.alpha)
  const beta = parseFloat(entry.beta)
  const gamma = parseFloat(entry.gamma)
  const vol = parseFloat(entry.vol)

  const lines = [
    `**${entry.formula?.replace(/- /g, '').replace(/ -/g, '').trim() || 'Unknown'}** (COD #${entry.file})`,
  ]

  if (entry.mineral) {
    lines.push(`- Mineral: ${entry.mineral}`)
  }
  lines.push(`- Space Group: ${entry.sg || 'N/A'} (#${entry.sgNumber || 'N/A'})`)
  lines.push(`- Lattice:`)
  lines.push(`  - a=${!isNaN(a) ? a.toFixed(3) : 'N/A'}Å, b=${!isNaN(b) ? b.toFixed(3) : 'N/A'}Å, c=${!isNaN(c) ? c.toFixed(3) : 'N/A'}Å`)
  lines.push(`  - α=${!isNaN(alpha) ? alpha.toFixed(1) : 'N/A'}°, β=${!isNaN(beta) ? beta.toFixed(1) : 'N/A'}°, γ=${!isNaN(gamma) ? gamma.toFixed(1) : 'N/A'}°`)

  if (!isNaN(vol)) {
    lines.push(`- Volume: ${vol.toFixed(2)} Å³`)
  }
  if (entry.Z) {
    lines.push(`- Z = ${entry.Z}`)
  }
  if (entry.year) {
    lines.push(`- Year: ${entry.year}`)
  }
  if (entry.doi) {
    lines.push(`- DOI: ${entry.doi}`)
  }
  lines.push(`- [COD 링크](https://www.crystallography.net/cod/${entry.file}.html)`)
  lines.push(`- [CIF 다운로드](https://www.crystallography.net/cod/${entry.file}.cif)`)

  return lines.join('\n')
}

export async function searchCod(formula: string, limit: number = 10): Promise<string> {
  try {
    // COD text search works better for formula
    const url = `${COD_API}?format=json&text=${encodeURIComponent(formula)}&max=${limit}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`COD API error: ${response.status}`)
    }

    const data = await response.json() as CodEntry[]

    if (!data || data.length === 0) {
      return `COD에서 "${formula}"에 해당하는 결정구조를 찾지 못했습니다.`
    }

    // Filter to get more relevant results (formula contains the search term)
    const filtered = data.filter(entry => {
      const f = (entry.formula || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const search = formula.toLowerCase().replace(/[^a-z0-9]/g, '')
      return f.includes(search) || search.includes(f)
    }).slice(0, limit)

    if (filtered.length === 0) {
      // If no exact matches, return first few results
      const formatted = data.slice(0, limit).map(formatCodEntry).join('\n\n')
      return `[COD] "${formula}" 관련 검색 결과 (${Math.min(data.length, limit)}개):\n\n${formatted}`
    }

    const formatted = filtered.map(formatCodEntry).join('\n\n')
    return `[COD] "${formula}" 검색 결과 (${filtered.length}개):\n\n${formatted}`
  } catch (error) {
    return `COD 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchCodByElements(elements: string[], limit: number = 10): Promise<string> {
  try {
    // COD element search: el1=Si&el2=O&nel=2
    const elementParams = elements.map((el, i) => `el${i + 1}=${el}`).join('&')
    const url = `${COD_API}?format=json&${elementParams}&nel=${elements.length}&max=${limit}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`COD API error: ${response.status}`)
    }

    const data = await response.json() as CodEntry[]

    if (!data || data.length === 0) {
      return `COD에서 ${elements.join('-')} 시스템의 결정구조를 찾지 못했습니다.`
    }

    const formatted = data.slice(0, limit).map(formatCodEntry).join('\n\n')
    return `[COD] ${elements.join('-')} 시스템 검색 결과 (${Math.min(data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `COD 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function searchCodBySpaceGroup(spaceGroup: string, limit: number = 10): Promise<string> {
  try {
    const url = `${COD_API}?format=json&sg=${encodeURIComponent(spaceGroup)}&max=${limit}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`COD API error: ${response.status}`)
    }

    const data = await response.json() as CodEntry[]

    if (!data || data.length === 0) {
      return `COD에서 space group "${spaceGroup}"에 해당하는 결정구조를 찾지 못했습니다.`
    }

    const formatted = data.slice(0, limit).map(formatCodEntry).join('\n\n')
    return `[COD] Space Group "${spaceGroup}" 검색 결과 (${Math.min(data.length, limit)}개):\n\n${formatted}`
  } catch (error) {
    return `COD 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function getCodEntry(codId: string): Promise<string> {
  try {
    const url = `${COD_API}?format=json&id=${codId}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`COD API error: ${response.status}`)
    }

    const data = await response.json() as CodEntry[]

    if (!data || data.length === 0) {
      return `COD에서 ID "${codId}"를 찾지 못했습니다.`
    }

    return `[COD] 결정구조 상세 정보:\n\n${formatCodEntry(data[0])}`
  } catch (error) {
    return `COD 조회 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
