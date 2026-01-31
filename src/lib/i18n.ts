export type Language = 'ko' | 'en'

export interface Translations {
  siteName: string
  datasets: string
  aiAgent: string
  pageTitle: string
  pageSubtitle: string
  searchTitle: string
  searchSubtitle: string
  searchPlaceholder: string
  searchSuggestions: string[]
  computeTitle: string
  computeSubtitle: string
  computePlaceholder: string
  computeSuggestions: string[]
  send: string
  askQuestion: string
  error: string
  databaseSearch: string
  materialsProject: string
  mpDesc: string
  aflow: string
  aflowDesc: string
  oqmd: string
  oqmdDesc: string
  cod: string
  codDesc: string
  computationTools: string
  structureAnalysis: string
  structureAnalysisDesc: string
  phaseDiagram: string
  phaseDiagramDesc: string
  formatConversion: string
  formatConversionDesc: string
  elementInfo: string
  elementInfoDesc: string
  // Synthesis
  synthesis: string
  synthesisDesc: string
  precursors: string
  searchFormula: string
  searchPrecursor: string
  temperature: string
  allTypes: string
  solidState: string
  solGel: string
  noResults: string
  foundRecipes: string
  // Agent modes
  materialsMode: string
  synthesisMode: string
  synthesisPlaceholder: string
  synthesisSuggestions: string[]
  recipeMode: string
  recipePlaceholder: string
  recipeSuggestions: string[]
}

export const translations: Record<Language, Translations> = {
  ko: {
    // Header
    siteName: 'Materials Data Portal',
    datasets: '데이터셋',
    aiAgent: 'AI Agent',

    // Agent Page
    pageTitle: 'Materials AI Agent',
    pageSubtitle: '왼쪽: 데이터베이스 검색 | 오른쪽: Pymatgen/ASE 계산',

    // Search Panel
    searchTitle: 'Database Search',
    searchSubtitle: 'MP, AFLOW, OQMD, COD 검색',
    searchPlaceholder: '재료 검색... (예: SiO2 찾아줘)',
    searchSuggestions: [
      'SiO2를 모든 DB에서 검색해줘',
      'band gap이 1~2 eV인 재료 찾아줘',
      'Li-Co-O 안정한 재료 검색',
    ],

    // Compute Panel
    computeTitle: 'Computation',
    computeSubtitle: 'Pymatgen/ASE 계산',
    computePlaceholder: '계산 요청... (예: mp-149 분석해줘)',
    computeSuggestions: [
      'mp-149 실리콘 구조 분석해줘',
      'Li-Fe-O phase diagram 그려줘',
      'Fe 원소 정보 알려줘',
    ],

    // Common
    send: '전송',
    askQuestion: '질문해보세요!',
    error: '오류가 발생했습니다. 다시 시도해주세요.',

    // Info Cards - Search
    databaseSearch: 'Database Search',
    materialsProject: 'Materials Project',
    mpDesc: '150K+ DFT 계산',
    aflow: 'AFLOW',
    aflowDesc: '3.5M+ 엔트리',
    oqmd: 'OQMD',
    oqmdDesc: '1M+ 열역학',
    cod: 'COD',
    codDesc: '500K+ 실험 구조',

    // Info Cards - Compute
    computationTools: 'Computation Tools',
    structureAnalysis: '구조 분석',
    structureAnalysisDesc: '대칭성, 결합길이',
    phaseDiagram: 'Phase Diagram',
    phaseDiagramDesc: '안정성 분석',
    formatConversion: '포맷 변환',
    formatConversionDesc: 'CIF↔POSCAR↔XYZ',
    elementInfo: '원소 정보',
    elementInfoDesc: '전기음성도, 산화수',
    // Synthesis
    synthesis: '합성 레시피',
    synthesisDesc: '재료 합성 조건 검색',
    precursors: '전구체',
    searchFormula: '재료명 검색',
    searchPrecursor: '전구체로 검색',
    temperature: '온도',
    allTypes: '전체',
    solidState: '고상합성',
    solGel: '솔-겔',
    noResults: '검색 결과가 없습니다',
    foundRecipes: '개의 레시피 발견',
    // Agent modes
    materialsMode: 'Materials',
    synthesisMode: 'Synthesis',
    synthesisPlaceholder: '합성 레시피 검색... (예: LiCoO2 합성법)',
    synthesisSuggestions: [
      'LiCoO2 합성 레시피 찾아줘',
      'Li2CO3를 전구체로 사용하는 합성',
      '800-1000°C 온도 범위 합성',
    ],
    recipeMode: 'Recipe ✨',
    recipePlaceholder: '합성할 재료 입력... (예: IrRuNi)',
    recipeSuggestions: [
      'IrRuNi 합금 합성하고 싶어',
      'LiCoO2 배터리 양극재 만들기',
      'BaTiO3 세라믹 합성 방법',
    ],
  },
  en: {
    // Header
    siteName: 'Materials Data Portal',
    datasets: 'Datasets',
    aiAgent: 'AI Agent',

    // Agent Page
    pageTitle: 'Materials AI Agent',
    pageSubtitle: 'Left: Database Search | Right: Pymatgen/ASE Computation',

    // Search Panel
    searchTitle: 'Database Search',
    searchSubtitle: 'MP, AFLOW, OQMD, COD Search',
    searchPlaceholder: 'Search materials... (e.g., Find SiO2)',
    searchSuggestions: [
      'Search SiO2 in all databases',
      'Find materials with band gap 1-2 eV',
      'Search stable Li-Co-O materials',
    ],

    // Compute Panel
    computeTitle: 'Computation',
    computeSubtitle: 'Pymatgen/ASE Calculations',
    computePlaceholder: 'Request computation... (e.g., Analyze mp-149)',
    computeSuggestions: [
      'Analyze mp-149 silicon structure',
      'Draw Li-Fe-O phase diagram',
      'Show Fe element info',
    ],

    // Common
    send: 'Send',
    askQuestion: 'Ask a question!',
    error: 'An error occurred. Please try again.',

    // Info Cards - Search
    databaseSearch: 'Database Search',
    materialsProject: 'Materials Project',
    mpDesc: '150K+ DFT calculations',
    aflow: 'AFLOW',
    aflowDesc: '3.5M+ entries',
    oqmd: 'OQMD',
    oqmdDesc: '1M+ thermodynamics',
    cod: 'COD',
    codDesc: '500K+ experimental',

    // Info Cards - Compute
    computationTools: 'Computation Tools',
    structureAnalysis: 'Structure Analysis',
    structureAnalysisDesc: 'Symmetry, bond lengths',
    phaseDiagram: 'Phase Diagram',
    phaseDiagramDesc: 'Stability analysis',
    formatConversion: 'Format Conversion',
    formatConversionDesc: 'CIF↔POSCAR↔XYZ',
    elementInfo: 'Element Info',
    elementInfoDesc: 'Electronegativity, oxidation',
    // Synthesis
    synthesis: 'Synthesis Recipes',
    synthesisDesc: 'Search synthesis conditions',
    precursors: 'Precursors',
    searchFormula: 'Search by formula',
    searchPrecursor: 'Search by precursor',
    temperature: 'Temperature',
    allTypes: 'All',
    solidState: 'Solid-State',
    solGel: 'Sol-Gel',
    noResults: 'No results found',
    foundRecipes: 'recipes found',
    // Agent modes
    materialsMode: 'Materials',
    synthesisMode: 'Synthesis',
    synthesisPlaceholder: 'Search synthesis recipes... (e.g., LiCoO2 synthesis)',
    synthesisSuggestions: [
      'Find LiCoO2 synthesis recipes',
      'Syntheses using Li2CO3 as precursor',
      'Synthesis at 800-1000°C temperature',
    ],
    recipeMode: 'Recipe ✨',
    recipePlaceholder: 'Enter target material... (e.g., IrRuNi)',
    recipeSuggestions: [
      'I want to synthesize IrRuNi alloy',
      'Make LiCoO2 battery cathode',
      'BaTiO3 ceramic synthesis method',
    ],
  },
}

export type TranslationKey = keyof Translations
