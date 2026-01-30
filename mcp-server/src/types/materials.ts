export interface Material {
  material_id: string
  formula_pretty: string
  formula_anonymous: string
  chemsys: string
  nelements: number
  elements: string[]
  nsites: number
  volume: number
  density: number
  density_atomic: number
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
  ordering?: string
  total_magnetization?: number
  theoretical?: boolean
}

export interface SearchResult {
  data: Material[]
  meta: {
    total_doc: number
    max_limit: number
  }
}

export interface MaterialDetail extends Material {
  structure?: {
    lattice: {
      a: number
      b: number
      c: number
      alpha: number
      beta: number
      gamma: number
      volume: number
    }
  }
  dos?: object
  bandstructure?: object
}
