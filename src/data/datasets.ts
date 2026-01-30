export interface Dataset {
  id: string
  name: string
  description: string
  category: string
  url: string
  apiAvailable: boolean
  dataTypes: string[]
  size?: string
}

export const categories = [
  'All',
  'DFT Calculations',
  'Crystal Structures',
  'Properties',
  'Machine Learning',
  'Experimental',
] as const

export const datasets: Dataset[] = [
  {
    id: 'materials-project',
    name: 'Materials Project',
    description: 'Computed properties of known and predicted materials using DFT calculations. Over 150,000 inorganic compounds.',
    category: 'DFT Calculations',
    url: 'https://materialsproject.org',
    apiAvailable: true,
    dataTypes: ['Band gap', 'Formation energy', 'Crystal structure', 'Elastic properties'],
    size: '150,000+ compounds',
  },
  {
    id: 'aflow',
    name: 'AFLOW',
    description: 'Automatic FLOW for Materials Discovery. High-throughput DFT database with standardized calculations.',
    category: 'DFT Calculations',
    url: 'https://aflow.org',
    apiAvailable: true,
    dataTypes: ['Electronic structure', 'Thermodynamic properties', 'Crystal prototypes'],
    size: '3,500,000+ entries',
  },
  {
    id: 'oqmd',
    name: 'OQMD',
    description: 'Open Quantum Materials Database. DFT-calculated thermodynamic and structural properties.',
    category: 'DFT Calculations',
    url: 'https://oqmd.org',
    apiAvailable: true,
    dataTypes: ['Formation energy', 'Band gap', 'Volume', 'Stability'],
    size: '1,000,000+ entries',
  },
  {
    id: 'icsd',
    name: 'ICSD',
    description: 'Inorganic Crystal Structure Database. Comprehensive collection of crystal structures.',
    category: 'Crystal Structures',
    url: 'https://icsd.products.fiz-karlsruhe.de',
    apiAvailable: false,
    dataTypes: ['Crystal structures', 'Space groups', 'Atomic coordinates'],
    size: '260,000+ structures',
  },
  {
    id: 'cod',
    name: 'Crystallography Open Database (COD)',
    description: 'Free and open access to crystal structures of organic, inorganic, and metal-organic compounds.',
    category: 'Crystal Structures',
    url: 'https://www.crystallography.net/cod/',
    apiAvailable: true,
    dataTypes: ['Crystal structures', 'CIF files', 'Powder patterns'],
    size: '500,000+ structures',
  },
  {
    id: 'nomad',
    name: 'NOMAD',
    description: 'Novel Materials Discovery. Repository for computational materials science data with FAIR principles.',
    category: 'DFT Calculations',
    url: 'https://nomad-lab.eu',
    apiAvailable: true,
    dataTypes: ['DFT calculations', 'Molecular dynamics', 'Workflows'],
    size: '12,000,000+ calculations',
  },
  {
    id: 'matbench',
    name: 'Matbench',
    description: 'Benchmark datasets for materials property prediction using machine learning.',
    category: 'Machine Learning',
    url: 'https://matbench.materialsproject.org',
    apiAvailable: true,
    dataTypes: ['ML benchmarks', 'Property prediction', 'Model evaluation'],
    size: '13 tasks',
  },
  {
    id: 'jarvis',
    name: 'JARVIS-DFT',
    description: 'Joint Automated Repository for Various Integrated Simulations. NIST curated DFT database.',
    category: 'DFT Calculations',
    url: 'https://jarvis.nist.gov',
    apiAvailable: true,
    dataTypes: ['2D materials', 'Solar cells', 'Thermoelectrics', 'Topological materials'],
    size: '80,000+ materials',
  },
  {
    id: 'mpds',
    name: 'MPDS',
    description: 'Materials Platform for Data Science. Curated experimental and computational data.',
    category: 'Experimental',
    url: 'https://mpds.io',
    apiAvailable: true,
    dataTypes: ['Phase diagrams', 'Physical properties', 'Crystal structures'],
    size: '500,000+ entries',
  },
  {
    id: 'citrination',
    name: 'Citrination',
    description: 'AI-powered materials informatics platform with diverse datasets.',
    category: 'Machine Learning',
    url: 'https://citrination.com',
    apiAvailable: true,
    dataTypes: ['ML-ready datasets', 'Property predictions', 'Materials AI'],
    size: 'Various datasets',
  },
]
