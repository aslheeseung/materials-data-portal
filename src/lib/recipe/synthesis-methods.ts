/**
 * Synthesis Methods - Conditions and procedures for different synthesis routes
 */

export interface SynthesisStep {
  name: string
  description: { en: string; ko: string }
  temperature?: string
  time?: string
  atmosphere?: string
  details?: { en: string; ko: string }
}

export interface SynthesisMethod {
  id: 'solid-state' | 'sol-gel' | 'hydrothermal' | 'solution'
  name: { en: string; ko: string }
  description: { en: string; ko: string }
  icon: string
  conditions: {
    temperatureRange: [number, number]
    timeRange: [number, number]
    atmosphere: string[]
    pressure?: string
  }
  steps: SynthesisStep[]
  equipment: string[]
  advantages: { en: string[]; ko: string[] }
  suitableFor: { en: string[]; ko: string[] }
  reducingRequired: boolean
}

export const synthesisMethods: Record<string, SynthesisMethod> = {
  'solid-state': {
    id: 'solid-state',
    name: { en: 'Solid-State', ko: '고상 합성' },
    description: {
      en: 'High-temperature sintering of solid precursors',
      ko: '고체 전구체의 고온 소결 반응',
    },
    icon: '🔥',
    conditions: {
      temperatureRange: [800, 1400],
      timeRange: [6, 48],
      atmosphere: ['air', 'Ar', 'N2', 'Ar/H2 (5%)', 'O2'],
    },
    steps: [
      {
        name: 'weighing',
        description: {
          en: 'Weigh precursors in stoichiometric ratio',
          ko: '화학양론비에 맞게 전구체 칭량',
        },
      },
      {
        name: 'mixing',
        description: {
          en: 'Ball mill with grinding media',
          ko: '볼밀로 균일하게 혼합',
        },
        time: '4-6h',
        details: {
          en: 'Use ethanol or acetone as mixing medium. Agate or ZrO2 balls recommended.',
          ko: '에탄올 또는 아세톤을 혼합 매질로 사용. 마노 또는 ZrO2 볼 권장.',
        },
      },
      {
        name: 'drying',
        description: {
          en: 'Dry the mixture',
          ko: '혼합물 건조',
        },
        temperature: '80-100°C',
        time: 'overnight',
      },
      {
        name: 'calcining',
        description: {
          en: 'Pre-calcine to decompose carbonates/nitrates',
          ko: '탄산염/질산염 분해를 위한 1차 하소',
        },
        temperature: '500-700°C',
        time: '2-4h',
        atmosphere: 'air',
      },
      {
        name: 'regrinding',
        description: {
          en: 'Regrind and pelletize',
          ko: '재분쇄 후 펠렛 성형',
        },
        details: {
          en: 'Press into pellets at 100-200 MPa for better contact.',
          ko: '100-200 MPa로 가압하여 펠렛 성형.',
        },
      },
      {
        name: 'sintering',
        description: {
          en: 'Final sintering at high temperature',
          ko: '고온에서 최종 소결',
        },
        temperature: '900-1200°C',
        time: '12-24h',
      },
      {
        name: 'cooling',
        description: {
          en: 'Cool to room temperature',
          ko: '상온까지 서냉',
        },
        details: {
          en: 'Cool at 2-5°C/min to prevent cracking.',
          ko: '균열 방지를 위해 2-5°C/분으로 서냉.',
        },
      },
    ],
    equipment: ['Ball mill', 'Muffle furnace', 'Pellet press', 'Mortar & pestle'],
    advantages: {
      en: ['Simple setup', 'Scalable', 'No solvents', 'High purity'],
      ko: ['간단한 장비', '대량 합성 가능', '용매 불필요', '고순도'],
    },
    suitableFor: {
      en: ['Bulk ceramics', 'Oxides', 'Battery materials', 'Solid electrolytes'],
      ko: ['벌크 세라믹', '산화물', '배터리 재료', '고체 전해질'],
    },
    reducingRequired: false,
  },

  'sol-gel': {
    id: 'sol-gel',
    name: { en: 'Sol-Gel', ko: '솔-겔' },
    description: {
      en: 'Solution-based synthesis through gel formation',
      ko: '겔 형성을 통한 용액 기반 합성',
    },
    icon: '🧪',
    conditions: {
      temperatureRange: [400, 800],
      timeRange: [2, 12],
      atmosphere: ['air', 'N2'],
    },
    steps: [
      {
        name: 'dissolution',
        description: {
          en: 'Dissolve metal precursors in water/ethanol',
          ko: '금속 전구체를 물/에탄올에 용해',
        },
        details: {
          en: 'Heat gently if needed. Ensure complete dissolution.',
          ko: '필요시 가열. 완전 용해 확인.',
        },
      },
      {
        name: 'chelation',
        description: {
          en: 'Add chelating agent',
          ko: '킬레이트제 첨가',
        },
        details: {
          en: 'Use citric acid (molar ratio metal:citric = 1:1.5-2) or EDTA. Stir until clear.',
          ko: '구연산 (금속:구연산 = 1:1.5-2 몰비) 또는 EDTA 사용. 투명해질 때까지 교반.',
        },
      },
      {
        name: 'pH-adjustment',
        description: {
          en: 'Adjust pH with ammonia',
          ko: '암모니아로 pH 조절',
        },
        details: {
          en: 'Adjust to pH 6-7 for stable gel formation.',
          ko: '안정적 겔 형성을 위해 pH 6-7로 조절.',
        },
      },
      {
        name: 'gelation',
        description: {
          en: 'Evaporate to form gel',
          ko: '증발시켜 겔 형성',
        },
        temperature: '80-120°C',
        details: {
          en: 'Heat on hot plate with stirring until viscous gel forms.',
          ko: '핫플레이트에서 교반하며 점성 겔 형성까지 가열.',
        },
      },
      {
        name: 'drying',
        description: {
          en: 'Dry the gel',
          ko: '겔 건조',
        },
        temperature: '150-200°C',
        time: '6-12h',
        details: {
          en: 'Dry in oven until xerogel (dry powder) forms.',
          ko: '건조 분말(xerogel)이 될 때까지 오븐에서 건조.',
        },
      },
      {
        name: 'calcining',
        description: {
          en: 'Calcine to crystallize',
          ko: '결정화를 위한 하소',
        },
        temperature: '500-800°C',
        time: '2-6h',
        atmosphere: 'air',
        details: {
          en: 'Slow heating (2°C/min) to avoid rapid gas evolution.',
          ko: '급격한 가스 발생 방지를 위해 천천히 승온 (2°C/분).',
        },
      },
    ],
    equipment: ['Hot plate with stirrer', 'pH meter', 'Drying oven', 'Muffle furnace'],
    advantages: {
      en: ['Homogeneous mixing', 'Lower temperature', 'Nanoparticles', 'Controlled stoichiometry'],
      ko: ['균일한 혼합', '낮은 합성 온도', '나노입자 합성', '정밀한 조성 제어'],
    },
    suitableFor: {
      en: ['Nanoparticles', 'Thin films', 'Mixed oxides', 'Catalysts'],
      ko: ['나노입자', '박막', '복합 산화물', '촉매'],
    },
    reducingRequired: false,
  },

  'hydrothermal': {
    id: 'hydrothermal',
    name: { en: 'Hydrothermal', ko: '수열 합성' },
    description: {
      en: 'Synthesis in aqueous solution under pressure',
      ko: '고압 수용액 조건에서의 합성',
    },
    icon: '💧',
    conditions: {
      temperatureRange: [120, 250],
      timeRange: [6, 48],
      atmosphere: ['autogenous pressure'],
      pressure: '1-100 atm',
    },
    steps: [
      {
        name: 'preparation',
        description: {
          en: 'Prepare aqueous precursor solution',
          ko: '수용액 전구체 준비',
        },
        details: {
          en: 'Dissolve metal salts in DI water. Concentration typically 0.01-0.1 M.',
          ko: '금속염을 DI water에 용해. 농도는 보통 0.01-0.1 M.',
        },
      },
      {
        name: 'mineralizer',
        description: {
          en: 'Add mineralizer/surfactant if needed',
          ko: '필요시 광화제/계면활성제 첨가',
        },
        details: {
          en: 'Common mineralizers: NaOH, KOH, urea. Surfactants: PVP, CTAB for morphology control.',
          ko: '일반적 광화제: NaOH, KOH, 요소. 형태 제어용 계면활성제: PVP, CTAB.',
        },
      },
      {
        name: 'pH-adjustment',
        description: {
          en: 'Adjust pH',
          ko: 'pH 조절',
        },
        details: {
          en: 'pH affects crystal morphology and size. Typical range: pH 8-12.',
          ko: 'pH가 결정 형태와 크기에 영향. 일반적 범위: pH 8-12.',
        },
      },
      {
        name: 'transfer',
        description: {
          en: 'Transfer to Teflon-lined autoclave',
          ko: '테프론 라이닝 오토클레이브에 이송',
        },
        details: {
          en: 'Fill to 70-80% capacity. Leave headspace for pressure.',
          ko: '용량의 70-80%만 채움. 압력을 위한 공간 확보.',
        },
      },
      {
        name: 'reaction',
        description: {
          en: 'Heat in autoclave',
          ko: '오토클레이브에서 반응',
        },
        temperature: '150-220°C',
        time: '12-24h',
        details: {
          en: 'Place in preheated oven. Do not disturb during reaction.',
          ko: '예열된 오븐에 넣음. 반응 중 흔들지 않음.',
        },
      },
      {
        name: 'cooling',
        description: {
          en: 'Cool naturally to room temperature',
          ko: '자연 냉각',
        },
      },
      {
        name: 'washing',
        description: {
          en: 'Wash and collect product',
          ko: '생성물 세척 및 수집',
        },
        details: {
          en: 'Centrifuge, wash with water and ethanol 3x each. Dry at 60°C.',
          ko: '원심분리 후 물과 에탄올로 각각 3회 세척. 60°C에서 건조.',
        },
      },
    ],
    equipment: ['Teflon-lined autoclave', 'Oven', 'Centrifuge', 'pH meter'],
    advantages: {
      en: ['Low temperature', 'Crystalline products', 'Morphology control', 'One-pot synthesis'],
      ko: ['저온 합성', '결정성 생성물', '형태 제어', '원팟 합성'],
    },
    suitableFor: {
      en: ['Nanostructures', 'Zeolites', 'Metal oxides', 'Quantum dots'],
      ko: ['나노구조', '제올라이트', '금속 산화물', '양자점'],
    },
    reducingRequired: false,
  },

  'solution': {
    id: 'solution',
    name: { en: 'Solution-Based', ko: '용액 기반' },
    description: {
      en: 'Wet chemical reduction or precipitation',
      ko: '습식 화학 환원 또는 침전법',
    },
    icon: '⚗️',
    conditions: {
      temperatureRange: [25, 100],
      timeRange: [0.5, 6],
      atmosphere: ['air', 'N2', 'Ar'],
    },
    steps: [
      {
        name: 'dissolution',
        description: {
          en: 'Dissolve metal salts in solvent',
          ko: '금속염을 용매에 용해',
        },
        details: {
          en: 'Use water, ethanol, or ethylene glycol. Sonicate if needed.',
          ko: '물, 에탄올, 또는 에틸렌 글리콜 사용. 필요시 초음파 처리.',
        },
      },
      {
        name: 'stabilizer',
        description: {
          en: 'Add capping agent/stabilizer',
          ko: '캡핑제/안정제 첨가',
        },
        details: {
          en: 'PVP, citrate, or oleylamine to prevent agglomeration.',
          ko: '응집 방지를 위해 PVP, 시트레이트, 또는 올레일아민 사용.',
        },
      },
      {
        name: 'reduction',
        description: {
          en: 'Add reducing agent and react',
          ko: '환원제 첨가 및 반응',
        },
        temperature: 'RT-100°C',
        time: '1-4h',
        details: {
          en: 'Common reducers: NaBH4 (fast, strong), ascorbic acid (mild), EG (polyol).',
          ko: '일반적 환원제: NaBH4 (빠름, 강함), 아스코르브산 (온화), EG (폴리올).',
        },
      },
      {
        name: 'color-change',
        description: {
          en: 'Monitor color change',
          ko: '색 변화 관찰',
        },
        details: {
          en: 'Color change indicates reduction: e.g., yellow→brown (Au), orange→black (Pt).',
          ko: '색 변화가 환원을 나타냄: 예) 노랑→갈색 (Au), 주황→검정 (Pt).',
        },
      },
      {
        name: 'separation',
        description: {
          en: 'Separate product',
          ko: '생성물 분리',
        },
        details: {
          en: 'Centrifuge at 8000-10000 rpm for 10-15 min.',
          ko: '8000-10000 rpm에서 10-15분 원심분리.',
        },
      },
      {
        name: 'washing',
        description: {
          en: 'Wash multiple times',
          ko: '여러 번 세척',
        },
        details: {
          en: 'Wash with ethanol and water alternately, 3x each.',
          ko: '에탄올과 물로 번갈아 각각 3회 세척.',
        },
      },
      {
        name: 'drying',
        description: {
          en: 'Dry under vacuum or inert gas',
          ko: '진공 또는 불활성 기체 하에서 건조',
        },
        temperature: '60°C',
        time: '12h',
        details: {
          en: 'Vacuum dry to prevent oxidation of metal nanoparticles.',
          ko: '금속 나노입자 산화 방지를 위해 진공 건조.',
        },
      },
    ],
    equipment: ['Round-bottom flask', 'Magnetic stirrer', 'Centrifuge', 'Vacuum oven', 'Schlenk line (optional)'],
    advantages: {
      en: ['Low temperature', 'Fast', 'Simple equipment', 'Size control'],
      ko: ['저온', '빠른 합성', '간단한 장비', '크기 제어 가능'],
    },
    suitableFor: {
      en: ['Metal nanoparticles', 'Alloys', 'Catalysts', 'Colloidal dispersions'],
      ko: ['금속 나노입자', '합금', '촉매', '콜로이드 분산액'],
    },
    reducingRequired: true,
  },
}

/**
 * Get method information by ID
 */
export function getMethod(id: string): SynthesisMethod | null {
  return synthesisMethods[id] || null
}

/**
 * Get all methods as array
 */
export function getAllMethods(): SynthesisMethod[] {
  return Object.values(synthesisMethods)
}

/**
 * Check if method requires reducing atmosphere for metals/alloys
 */
export function needsReducingAtmosphere(method: string, targetElements: string[]): boolean {
  const noblemetals = ['Au', 'Pt', 'Pd', 'Ag', 'Ir', 'Ru', 'Rh', 'Os']
  const hasNoble = targetElements.some(el => noblemetals.includes(el))

  // Metals/alloys need reducing for solid-state to get metallic phase
  if (method === 'solid-state' && hasNoble) {
    return true
  }

  return false
}
