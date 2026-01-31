// Transition metals (21 elements)
export const TRANSITION_METALS = [
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg'
]

// Common transition metals (excluding radioactive/rare)
export const COMMON_TRANSITION_METALS = [
  'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Zr', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au'
]

// Noble metals (for catalysis)
export const NOBLE_METALS = ['Ru', 'Rh', 'Pd', 'Os', 'Ir', 'Pt', 'Au', 'Ag']

// Battery-related elements
export const BATTERY_ELEMENTS = {
  cathode: ['Li', 'Na', 'K'],
  transitionMetals: ['Co', 'Ni', 'Mn', 'Fe', 'V', 'Ti', 'Cr'],
  anions: ['O', 'S', 'F', 'P']
}

// Thermoelectric elements
export const THERMOELECTRIC_ELEMENTS = ['Bi', 'Te', 'Sb', 'Se', 'Pb', 'Sn', 'Ge', 'Si']

// Generate combinations
export function generateCombinations<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []

  function combine(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo])
      return
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i])
      combine(i + 1, combo)
      combo.pop()
    }
  }

  combine(0, [])
  return result
}

// Calculate number of combinations
export function combinationCount(n: number, r: number): number {
  if (r > n) return 0
  if (r === 0 || r === n) return 1

  let result = 1
  for (let i = 0; i < r; i++) {
    result = result * (n - i) / (i + 1)
  }
  return Math.round(result)
}

// Element group definitions
export const ELEMENT_GROUPS: Record<string, string[]> = {
  'transition-metals': COMMON_TRANSITION_METALS,
  'noble-metals': NOBLE_METALS,
  'alkali': ['Li', 'Na', 'K', 'Rb', 'Cs'],
  'alkaline-earth': ['Be', 'Mg', 'Ca', 'Sr', 'Ba'],
  'lanthanides': ['La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'],
  'chalcogens': ['O', 'S', 'Se', 'Te'],
  'halogens': ['F', 'Cl', 'Br', 'I'],
  'pnictogens': ['N', 'P', 'As', 'Sb', 'Bi'],
}

// Parse element group from query
export function parseElementGroup(query: string): string[] | null {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('전이금속') || lowerQuery.includes('transition metal')) {
    return COMMON_TRANSITION_METALS
  }
  if (lowerQuery.includes('귀금속') || lowerQuery.includes('noble metal') || lowerQuery.includes('백금족')) {
    return NOBLE_METALS
  }
  if (lowerQuery.includes('알칼리') || lowerQuery.includes('alkali')) {
    if (lowerQuery.includes('토') || lowerQuery.includes('earth')) {
      return ELEMENT_GROUPS['alkaline-earth']
    }
    return ELEMENT_GROUPS['alkali']
  }
  if (lowerQuery.includes('란탄') || lowerQuery.includes('희토류') || lowerQuery.includes('lanthanide') || lowerQuery.includes('rare earth')) {
    return ELEMENT_GROUPS['lanthanides']
  }

  return null
}

// Parse system size (binary, ternary, quaternary)
export function parseSystemSize(query: string): number {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('2원') || lowerQuery.includes('이원') || lowerQuery.includes('binary')) return 2
  if (lowerQuery.includes('3원') || lowerQuery.includes('삼원') || lowerQuery.includes('ternary')) return 3
  if (lowerQuery.includes('4원') || lowerQuery.includes('사원') || lowerQuery.includes('quaternary')) return 4
  if (lowerQuery.includes('5원') || lowerQuery.includes('오원') || lowerQuery.includes('quinary')) return 5

  // Default to ternary
  return 3
}

// Research query types
export type ResearchQueryType =
  | 'combination-screening'  // Find candidates from element combinations
  | 'property-screening'     // Find materials with specific properties
  | 'synthesis-feasibility'  // Check if synthesis is possible
  | 'application-search'     // Search for specific applications

export interface ResearchQuery {
  type: ResearchQueryType
  elements?: string[]
  systemSize?: number
  properties?: {
    bandGapMin?: number
    bandGapMax?: number
    stable?: boolean
  }
  application?: string
  limit?: number
}

export function parseResearchQuery(message: string): ResearchQuery {
  const lowerMsg = message.toLowerCase()

  // Detect element group
  const elementGroup = parseElementGroup(message)

  // Detect system size
  const systemSize = parseSystemSize(message)

  // Detect specific elements mentioned
  const mentionedElements = message.match(/\b([A-Z][a-z]?)\b/g)?.filter(e =>
    e.length <= 2 && /^[A-Z][a-z]?$/.test(e)
  ) || []

  // Detect properties
  const bandGapMatch = message.match(/(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)\s*eV/i)
  const wantStable = lowerMsg.includes('안정') || lowerMsg.includes('stable')

  // Detect application
  let application: string | undefined
  if (lowerMsg.includes('배터리') || lowerMsg.includes('battery')) application = 'battery'
  if (lowerMsg.includes('촉매') || lowerMsg.includes('catalyst')) application = 'catalyst'
  if (lowerMsg.includes('초전도') || lowerMsg.includes('superconductor')) application = 'superconductor'
  if (lowerMsg.includes('열전') || lowerMsg.includes('thermoelectric')) application = 'thermoelectric'
  if (lowerMsg.includes('자성') || lowerMsg.includes('magnetic')) application = 'magnetic'

  return {
    type: elementGroup ? 'combination-screening' : 'property-screening',
    elements: elementGroup || (mentionedElements.length > 0 ? mentionedElements : undefined),
    systemSize,
    properties: {
      bandGapMin: bandGapMatch ? parseFloat(bandGapMatch[1]) : undefined,
      bandGapMax: bandGapMatch ? parseFloat(bandGapMatch[2]) : undefined,
      stable: wantStable,
    },
    application,
    limit: 20,
  }
}
