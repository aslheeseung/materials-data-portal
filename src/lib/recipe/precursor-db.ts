/**
 * Precursor Database - Element to precursor mapping
 */

export interface PrecursorInfo {
  formula: string
  name: string
  type: 'oxide' | 'carbonate' | 'nitrate' | 'hydroxide' | 'chloride' | 'organic' | 'metal'
  preferredFor: ('solid-state' | 'sol-gel' | 'hydrothermal' | 'solution')[]
}

export const precursorDB: Record<string, PrecursorInfo[]> = {
  // Alkali metals
  'Li': [
    { formula: 'Li2CO3', name: 'lithium carbonate', type: 'carbonate', preferredFor: ['solid-state'] },
    { formula: 'LiOH·H2O', name: 'lithium hydroxide monohydrate', type: 'hydroxide', preferredFor: ['sol-gel', 'solution'] },
    { formula: 'LiNO3', name: 'lithium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'Li2O', name: 'lithium oxide', type: 'oxide', preferredFor: ['solid-state'] },
  ],
  'Na': [
    { formula: 'Na2CO3', name: 'sodium carbonate', type: 'carbonate', preferredFor: ['solid-state'] },
    { formula: 'NaOH', name: 'sodium hydroxide', type: 'hydroxide', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'NaNO3', name: 'sodium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'K': [
    { formula: 'K2CO3', name: 'potassium carbonate', type: 'carbonate', preferredFor: ['solid-state'] },
    { formula: 'KOH', name: 'potassium hydroxide', type: 'hydroxide', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'KNO3', name: 'potassium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],

  // Alkaline earth metals
  'Mg': [
    { formula: 'MgO', name: 'magnesium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Mg(NO3)2·6H2O', name: 'magnesium nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'MgCl2', name: 'magnesium chloride', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
  ],
  'Ca': [
    { formula: 'CaCO3', name: 'calcium carbonate', type: 'carbonate', preferredFor: ['solid-state'] },
    { formula: 'Ca(NO3)2·4H2O', name: 'calcium nitrate tetrahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'CaO', name: 'calcium oxide', type: 'oxide', preferredFor: ['solid-state'] },
  ],
  'Sr': [
    { formula: 'SrCO3', name: 'strontium carbonate', type: 'carbonate', preferredFor: ['solid-state'] },
    { formula: 'Sr(NO3)2', name: 'strontium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Ba': [
    { formula: 'BaCO3', name: 'barium carbonate', type: 'carbonate', preferredFor: ['solid-state'] },
    { formula: 'Ba(NO3)2', name: 'barium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],

  // 3d Transition metals
  'Ti': [
    { formula: 'TiO2', name: 'titanium dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Ti(OC4H9)4', name: 'titanium butoxide', type: 'organic', preferredFor: ['sol-gel'] },
    { formula: 'TiCl4', name: 'titanium tetrachloride', type: 'chloride', preferredFor: ['hydrothermal'] },
  ],
  'V': [
    { formula: 'V2O5', name: 'vanadium pentoxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'NH4VO3', name: 'ammonium metavanadate', type: 'nitrate', preferredFor: ['sol-gel', 'hydrothermal'] },
  ],
  'Cr': [
    { formula: 'Cr2O3', name: 'chromium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Cr(NO3)3·9H2O', name: 'chromium nitrate nonahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Mn': [
    { formula: 'MnO2', name: 'manganese dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Mn(NO3)2·4H2O', name: 'manganese nitrate tetrahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'MnCl2·4H2O', name: 'manganese chloride tetrahydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'Mn(CH3COO)2', name: 'manganese acetate', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'Fe': [
    { formula: 'Fe2O3', name: 'iron(III) oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Fe(NO3)3·9H2O', name: 'iron nitrate nonahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'FeCl3·6H2O', name: 'iron chloride hexahydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'FeC2O4·2H2O', name: 'iron oxalate dihydrate', type: 'organic', preferredFor: ['solid-state'] },
  ],
  'Co': [
    { formula: 'Co3O4', name: 'cobalt oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Co(NO3)2·6H2O', name: 'cobalt nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'CoCl2·6H2O', name: 'cobalt chloride hexahydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'Co(CH3COO)2', name: 'cobalt acetate', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'Ni': [
    { formula: 'NiO', name: 'nickel oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Ni(NO3)2·6H2O', name: 'nickel nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'NiCl2·6H2O', name: 'nickel chloride hexahydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'Ni(CH3COO)2', name: 'nickel acetate', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'Cu': [
    { formula: 'CuO', name: 'copper oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Cu(NO3)2·3H2O', name: 'copper nitrate trihydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'CuCl2·2H2O', name: 'copper chloride dihydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'Cu(CH3COO)2', name: 'copper acetate', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'Zn': [
    { formula: 'ZnO', name: 'zinc oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Zn(NO3)2·6H2O', name: 'zinc nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'ZnCl2', name: 'zinc chloride', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'Zn(CH3COO)2', name: 'zinc acetate', type: 'organic', preferredFor: ['sol-gel'] },
  ],

  // 4d/5d Transition metals (Platinum group)
  'Zr': [
    { formula: 'ZrO2', name: 'zirconium dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Zr(NO3)4·5H2O', name: 'zirconium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'ZrOCl2·8H2O', name: 'zirconium oxychloride', type: 'chloride', preferredFor: ['hydrothermal'] },
  ],
  'Nb': [
    { formula: 'Nb2O5', name: 'niobium pentoxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'NbCl5', name: 'niobium pentachloride', type: 'chloride', preferredFor: ['hydrothermal'] },
  ],
  'Mo': [
    { formula: 'MoO3', name: 'molybdenum trioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: '(NH4)6Mo7O24', name: 'ammonium heptamolybdate', type: 'nitrate', preferredFor: ['sol-gel', 'hydrothermal'] },
  ],
  'Ru': [
    { formula: 'RuO2', name: 'ruthenium dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'RuCl3·xH2O', name: 'ruthenium chloride hydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'Ru(NO)(NO3)3', name: 'ruthenium nitrosyl nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Rh': [
    { formula: 'Rh2O3', name: 'rhodium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'RhCl3·xH2O', name: 'rhodium chloride hydrate', type: 'chloride', preferredFor: ['solution'] },
  ],
  'Pd': [
    { formula: 'PdO', name: 'palladium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'PdCl2', name: 'palladium chloride', type: 'chloride', preferredFor: ['solution'] },
    { formula: 'Pd(NO3)2', name: 'palladium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Ag': [
    { formula: 'Ag2O', name: 'silver oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'AgNO3', name: 'silver nitrate', type: 'nitrate', preferredFor: ['sol-gel', 'solution'] },
  ],
  'W': [
    { formula: 'WO3', name: 'tungsten trioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: '(NH4)2WO4', name: 'ammonium tungstate', type: 'nitrate', preferredFor: ['sol-gel', 'hydrothermal'] },
  ],
  'Re': [
    { formula: 'Re2O7', name: 'rhenium heptoxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'NH4ReO4', name: 'ammonium perrhenate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Os': [
    { formula: 'OsO2', name: 'osmium dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'OsCl3', name: 'osmium trichloride', type: 'chloride', preferredFor: ['solution'] },
  ],
  'Ir': [
    { formula: 'IrO2', name: 'iridium dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'IrCl3·xH2O', name: 'iridium chloride hydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'H2IrCl6', name: 'hexachloroiridic acid', type: 'chloride', preferredFor: ['solution'] },
  ],
  'Pt': [
    { formula: 'PtO2', name: 'platinum dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'H2PtCl6', name: 'hexachloroplatinic acid', type: 'chloride', preferredFor: ['solution'] },
    { formula: 'Pt(NH3)4Cl2', name: 'tetraammineplatinum chloride', type: 'chloride', preferredFor: ['hydrothermal'] },
  ],
  'Au': [
    { formula: 'HAuCl4', name: 'chloroauric acid', type: 'chloride', preferredFor: ['solution'] },
    { formula: 'Au2O3', name: 'gold oxide', type: 'oxide', preferredFor: ['solid-state'] },
  ],

  // Lanthanides
  'La': [
    { formula: 'La2O3', name: 'lanthanum oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'La(NO3)3·6H2O', name: 'lanthanum nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Ce': [
    { formula: 'CeO2', name: 'cerium dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Ce(NO3)3·6H2O', name: 'cerium nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Y': [
    { formula: 'Y2O3', name: 'yttrium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Y(NO3)3·6H2O', name: 'yttrium nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Nd': [
    { formula: 'Nd2O3', name: 'neodymium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Nd(NO3)3·6H2O', name: 'neodymium nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Sm': [
    { formula: 'Sm2O3', name: 'samarium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Sm(NO3)3·6H2O', name: 'samarium nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],
  'Gd': [
    { formula: 'Gd2O3', name: 'gadolinium oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Gd(NO3)3·6H2O', name: 'gadolinium nitrate hexahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],

  // Main group elements
  'Al': [
    { formula: 'Al2O3', name: 'aluminum oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Al(NO3)3·9H2O', name: 'aluminum nitrate nonahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'Al(OC4H9)3', name: 'aluminum butoxide', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'Si': [
    { formula: 'SiO2', name: 'silicon dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Si(OC2H5)4', name: 'tetraethyl orthosilicate (TEOS)', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'Sn': [
    { formula: 'SnO2', name: 'tin dioxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'SnCl4·5H2O', name: 'tin chloride pentahydrate', type: 'chloride', preferredFor: ['hydrothermal', 'solution'] },
  ],
  'Pb': [
    { formula: 'PbO', name: 'lead oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Pb(NO3)2', name: 'lead nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'Pb(CH3COO)2', name: 'lead acetate', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'Bi': [
    { formula: 'Bi2O3', name: 'bismuth oxide', type: 'oxide', preferredFor: ['solid-state'] },
    { formula: 'Bi(NO3)3·5H2O', name: 'bismuth nitrate pentahydrate', type: 'nitrate', preferredFor: ['sol-gel'] },
  ],

  // Non-metals (as additives)
  'P': [
    { formula: 'NH4H2PO4', name: 'ammonium dihydrogen phosphate', type: 'nitrate', preferredFor: ['solid-state', 'sol-gel'] },
    { formula: 'H3PO4', name: 'phosphoric acid', type: 'oxide', preferredFor: ['sol-gel'] },
  ],
  'S': [
    { formula: 'Na2S', name: 'sodium sulfide', type: 'oxide', preferredFor: ['hydrothermal'] },
    { formula: 'thiourea', name: 'thiourea', type: 'organic', preferredFor: ['hydrothermal', 'solution'] },
  ],
  'C': [
    { formula: 'citric acid', name: 'citric acid', type: 'organic', preferredFor: ['sol-gel'] },
    { formula: 'sucrose', name: 'sucrose', type: 'organic', preferredFor: ['sol-gel'] },
  ],
  'N': [
    { formula: 'NH4NO3', name: 'ammonium nitrate', type: 'nitrate', preferredFor: ['sol-gel'] },
    { formula: 'urea', name: 'urea', type: 'organic', preferredFor: ['hydrothermal'] },
  ],
}

/**
 * Get precursors for a given element and synthesis method
 */
export function getPrecursors(
  element: string,
  method: 'solid-state' | 'sol-gel' | 'hydrothermal' | 'solution'
): PrecursorInfo[] {
  const precursors = precursorDB[element] || []
  return precursors
    .filter(p => p.preferredFor.includes(method))
    .sort((a, b) => {
      // Prioritize by preference order
      const aIndex = a.preferredFor.indexOf(method)
      const bIndex = b.preferredFor.indexOf(method)
      return aIndex - bIndex
    })
}

/**
 * Get best precursor for an element and method
 */
export function getBestPrecursor(
  element: string,
  method: 'solid-state' | 'sol-gel' | 'hydrothermal' | 'solution'
): PrecursorInfo | null {
  const precursors = getPrecursors(element, method)
  return precursors[0] || null
}

/**
 * Check if element has precursor data
 */
export function hasElement(element: string): boolean {
  return element in precursorDB
}
