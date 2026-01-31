/**
 * Element Parser - Parse chemical formulas to extract elements
 */

// Periodic table elements
const ELEMENTS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
  'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
  'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
]

// Two-letter elements (for priority matching)
const TWO_LETTER_ELEMENTS = ELEMENTS.filter(e => e.length === 2)

export interface ParsedElement {
  symbol: string
  count: number
}

export interface ParsedFormula {
  formula: string
  elements: ParsedElement[]
  uniqueElements: string[]
}

/**
 * Parse a chemical formula and extract elements
 * Examples:
 *   "LiCoO2" → [Li, Co, O]
 *   "IrRuNi" → [Ir, Ru, Ni]
 *   "BaTiO3" → [Ba, Ti, O]
 */
export function parseFormula(formula: string): ParsedFormula {
  const elements: ParsedElement[] = []
  let remaining = formula.trim()

  while (remaining.length > 0) {
    let matched = false

    // Try two-letter elements first
    for (const el of TWO_LETTER_ELEMENTS) {
      if (remaining.startsWith(el)) {
        const afterElement = remaining.slice(el.length)
        const countMatch = afterElement.match(/^(\d+\.?\d*)/)
        const count = countMatch ? parseFloat(countMatch[1]) : 1

        elements.push({ symbol: el, count })
        remaining = afterElement.slice(countMatch?.[0].length || 0)
        matched = true
        break
      }
    }

    if (!matched) {
      // Try single-letter elements
      const firstChar = remaining[0]
      if (firstChar >= 'A' && firstChar <= 'Z' && ELEMENTS.includes(firstChar)) {
        const afterElement = remaining.slice(1)
        const countMatch = afterElement.match(/^(\d+\.?\d*)/)
        const count = countMatch ? parseFloat(countMatch[1]) : 1

        elements.push({ symbol: firstChar, count })
        remaining = afterElement.slice(countMatch?.[0].length || 0)
        matched = true
      }
    }

    if (!matched) {
      // Skip non-element characters (parentheses, dots, etc.)
      remaining = remaining.slice(1)
    }
  }

  // Merge duplicate elements
  const merged: Record<string, number> = {}
  for (const el of elements) {
    merged[el.symbol] = (merged[el.symbol] || 0) + el.count
  }

  const mergedElements = Object.entries(merged).map(([symbol, count]) => ({
    symbol,
    count,
  }))

  return {
    formula,
    elements: mergedElements,
    uniqueElements: mergedElements.map(e => e.symbol),
  }
}

/**
 * Extract target material from user message
 */
export function extractTargetMaterial(message: string): string | null {
  // Common patterns
  const patterns = [
    // "synthesize X", "make X", "create X"
    /(?:synthesize|합성|make|create|만들|prepare)\s+([A-Z][a-zA-Z0-9]+)/i,
    // "X synthesis", "X 합성"
    /([A-Z][a-zA-Z0-9]+)\s*(?:synthesis|합성|alloy|합금|compound|화합물)/i,
    // Direct formula pattern
    /\b([A-Z][a-z]?(?:\d*[A-Z][a-z]?)+\d*)\b/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      // Validate it contains actual elements
      const parsed = parseFormula(match[1])
      if (parsed.uniqueElements.length > 0) {
        return match[1]
      }
    }
  }

  return null
}

/**
 * Detect synthesis method from user message
 */
export function detectSynthesisMethod(message: string): string | null {
  const lowerMessage = message.toLowerCase()

  const methodPatterns: Record<string, string[]> = {
    'solid-state': ['solid state', 'solid-state', '고상', '고상합성', 'calcin', 'sinter'],
    'sol-gel': ['sol-gel', 'sol gel', '솔겔', '솔-겔', 'citrate', 'pechini'],
    'hydrothermal': ['hydrothermal', '수열', 'autoclave', 'solvothermal'],
    'solution': ['solution', '용액', 'wet', 'precipitation', '침전', 'reduction', '환원'],
  }

  for (const [method, keywords] of Object.entries(methodPatterns)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return method
      }
    }
  }

  return null
}

/**
 * Generate material name from elements
 */
export function generateMaterialName(elements: string[]): string {
  const names: Record<string, string> = {
    'Li': 'lithium', 'Na': 'sodium', 'K': 'potassium',
    'Co': 'cobalt', 'Ni': 'nickel', 'Fe': 'iron', 'Mn': 'manganese',
    'Ti': 'titanium', 'V': 'vanadium', 'Cr': 'chromium',
    'Cu': 'copper', 'Zn': 'zinc', 'Al': 'aluminum',
    'O': 'oxide', 'S': 'sulfide', 'N': 'nitride',
    'Ir': 'iridium', 'Ru': 'ruthenium', 'Pt': 'platinum', 'Pd': 'palladium',
    'Au': 'gold', 'Ag': 'silver',
    'Ba': 'barium', 'Sr': 'strontium', 'Ca': 'calcium',
    'La': 'lanthanum', 'Ce': 'cerium', 'Y': 'yttrium',
  }

  return elements.map(el => names[el] || el.toLowerCase()).join(' ')
}
