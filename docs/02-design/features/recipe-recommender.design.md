# Design: Recipe Recommender

## Overview

| Item | Description |
|------|-------------|
| Feature | AI-based Synthesis Recipe Recommender |
| Plan Reference | `docs/01-plan/features/recipe-recommender.plan.md` |
| Created | 2026-01-31 |
| Status | Design |

---

## 1. User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Recipe Recommender Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Start] ─────► [Input Target Material]                          │
│                        │                                         │
│                        ▼                                         │
│              "IrRuNi 합성하고 싶어"                               │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AI: "어떤 합성 방법을 원하시나요?"                        │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ Solid    │ │ Sol-Gel  │ │ Hydro-   │ │ Solution │   │    │
│  │  │ State    │ │          │ │ thermal  │ │ Based    │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ (User selects method)                   │
│                        │                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AI: Generate Recipe                                     │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ 📦 Precursors: IrO2, RuO2, NiO                  │    │    │
│  │  │ 🔥 Temperature: 900-1100°C                      │    │    │
│  │  │ ⏱️ Time: 12-24h                                 │    │    │
│  │  │ 💨 Atmosphere: Ar/H2                            │    │    │
│  │  │ ⚙️ Procedure: 1. Ball mill...                   │    │    │
│  │  │ 📚 References: Similar IrRu (DOI: 10.xxx)       │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼                                         │
│  [User can ask follow-up: "더 낮은 온도로?", "다른 전구체?"]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Page                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐   │
│  │      Search Panel           │  │    Compute Panel        │   │
│  │  ┌───────────────────────┐  │  │                         │   │
│  │  │[Materials][Synthesis] │  │  │   (기존 유지)            │   │
│  │  │[Recipe]               │  │  │                         │   │
│  │  └───────────────────────┘  │  │                         │   │
│  │                             │  │                         │   │
│  │  Recipe Mode:               │  │                         │   │
│  │  - Conversational UI        │  │                         │   │
│  │  - Method Selection Buttons │  │                         │   │
│  │  - Generated Recipe Display │  │                         │   │
│  └─────────────────────────────┘  └─────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐       ┌─────────────────────┐
│  /api/recipe        │       │  /api/compute       │
│  - Parse intent     │       │  (기존)             │
│  - Generate recipe  │       │                     │
│  - Find references  │       │                     │
└─────────────────────┘       └─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Recipe Service                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Element Parser  │  │ Precursor DB    │  │ Condition DB    │  │
│  │                 │  │                 │  │                 │  │
│  │ "IrRuNi" →      │  │ Ir → IrO2      │  │ solid-state:    │  │
│  │ [Ir, Ru, Ni]    │  │ Ru → RuO2      │  │ 800-1400°C      │  │
│  │                 │  │ Ni → NiO       │  │ 6-48h           │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Recipe Generator (LLM)                   │    │
│  │  - System prompt with synthesis expertise               │    │
│  │  - Grounded with precursor/condition data               │    │
│  │  - Referenced with similar materials from dataset       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Reference Finder                         │    │
│  │  - Search synthesis dataset for similar materials       │    │
│  │  - Extract relevant DOIs and conditions                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
materials-data-portal/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── recipe/
│   │           └── route.ts          # 🆕 Recipe API
│   │
│   ├── components/
│   │   └── DualChatInterface.tsx     # 수정: Recipe 모드 추가
│   │
│   ├── lib/
│   │   ├── recipe/
│   │   │   ├── element-parser.ts     # 🆕 화학식 파싱
│   │   │   ├── precursor-db.ts       # 🆕 원소-전구체 매핑
│   │   │   ├── synthesis-methods.ts  # 🆕 합성 방법 조건
│   │   │   └── recipe-generator.ts   # 🆕 레시피 생성 로직
│   │   └── i18n.ts                   # 수정: Recipe 번역 추가
│   │
│   └── data/
│       └── synthesis-recipes.ts      # 기존 (참조용)
│
└── mcp-server/
    └── src/
        └── index.ts                  # 수정: generate_recipe tool 추가
```

---

## 3. Data Schema

### 3.1 Element-Precursor Mapping

```typescript
// src/lib/recipe/precursor-db.ts

export interface PrecursorInfo {
  formula: string
  name: string
  type: 'oxide' | 'carbonate' | 'nitrate' | 'hydroxide' | 'chloride' | 'organic'
  molarMass: number
  preferredFor: ('solid-state' | 'sol-gel' | 'hydrothermal' | 'solution')[]
}

export const precursorDB: Record<string, PrecursorInfo[]> = {
  // Alkali metals
  'Li': [
    { formula: 'Li2CO3', name: 'lithium carbonate', type: 'carbonate', molarMass: 73.89, preferredFor: ['solid-state'] },
    { formula: 'LiOH', name: 'lithium hydroxide', type: 'hydroxide', molarMass: 23.95, preferredFor: ['sol-gel', 'solution'] },
    { formula: 'LiNO3', name: 'lithium nitrate', type: 'nitrate', molarMass: 68.95, preferredFor: ['sol-gel'] },
  ],

  // Transition metals
  'Co': [
    { formula: 'Co3O4', name: 'cobalt oxide', type: 'oxide', molarMass: 240.80, preferredFor: ['solid-state'] },
    { formula: 'Co(NO3)2·6H2O', name: 'cobalt nitrate hexahydrate', type: 'nitrate', molarMass: 291.03, preferredFor: ['sol-gel', 'solution'] },
    { formula: 'Co(CH3COO)2', name: 'cobalt acetate', type: 'organic', molarMass: 177.02, preferredFor: ['sol-gel'] },
  ],

  'Ni': [
    { formula: 'NiO', name: 'nickel oxide', type: 'oxide', molarMass: 74.69, preferredFor: ['solid-state'] },
    { formula: 'Ni(NO3)2·6H2O', name: 'nickel nitrate hexahydrate', type: 'nitrate', molarMass: 290.79, preferredFor: ['sol-gel', 'solution'] },
    { formula: 'NiCl2', name: 'nickel chloride', type: 'chloride', molarMass: 129.60, preferredFor: ['hydrothermal', 'solution'] },
  ],

  'Fe': [
    { formula: 'Fe2O3', name: 'iron(III) oxide', type: 'oxide', molarMass: 159.69, preferredFor: ['solid-state'] },
    { formula: 'Fe(NO3)3·9H2O', name: 'iron nitrate nonahydrate', type: 'nitrate', molarMass: 404.00, preferredFor: ['sol-gel'] },
    { formula: 'FeCl3', name: 'iron(III) chloride', type: 'chloride', molarMass: 162.20, preferredFor: ['hydrothermal', 'solution'] },
  ],

  // Platinum group metals
  'Ir': [
    { formula: 'IrO2', name: 'iridium oxide', type: 'oxide', molarMass: 224.22, preferredFor: ['solid-state'] },
    { formula: 'IrCl3', name: 'iridium chloride', type: 'chloride', molarMass: 298.58, preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'H2IrCl6', name: 'hexachloroiridic acid', type: 'chloride', molarMass: 407.93, preferredFor: ['solution'] },
  ],

  'Ru': [
    { formula: 'RuO2', name: 'ruthenium oxide', type: 'oxide', molarMass: 133.07, preferredFor: ['solid-state'] },
    { formula: 'RuCl3', name: 'ruthenium chloride', type: 'chloride', molarMass: 207.43, preferredFor: ['hydrothermal', 'solution'] },
    { formula: 'Ru(NO)(NO3)3', name: 'ruthenium nitrosyl nitrate', type: 'nitrate', molarMass: 317.07, preferredFor: ['sol-gel'] },
  ],

  'Pt': [
    { formula: 'PtO2', name: 'platinum oxide', type: 'oxide', molarMass: 227.08, preferredFor: ['solid-state'] },
    { formula: 'H2PtCl6', name: 'hexachloroplatinic acid', type: 'chloride', molarMass: 409.82, preferredFor: ['solution'] },
    { formula: 'Pt(NH3)4Cl2', name: 'tetraammineplatinum chloride', type: 'chloride', molarMass: 334.12, preferredFor: ['hydrothermal'] },
  ],

  // Common elements
  'Ti': [
    { formula: 'TiO2', name: 'titanium dioxide', type: 'oxide', molarMass: 79.87, preferredFor: ['solid-state'] },
    { formula: 'Ti(OC4H9)4', name: 'titanium butoxide', type: 'organic', molarMass: 340.32, preferredFor: ['sol-gel'] },
    { formula: 'TiCl4', name: 'titanium tetrachloride', type: 'chloride', molarMass: 189.68, preferredFor: ['hydrothermal'] },
  ],

  'Ba': [
    { formula: 'BaCO3', name: 'barium carbonate', type: 'carbonate', molarMass: 197.34, preferredFor: ['solid-state'] },
    { formula: 'Ba(NO3)2', name: 'barium nitrate', type: 'nitrate', molarMass: 261.34, preferredFor: ['sol-gel'] },
  ],

  'Sr': [
    { formula: 'SrCO3', name: 'strontium carbonate', type: 'carbonate', molarMass: 147.63, preferredFor: ['solid-state'] },
    { formula: 'Sr(NO3)2', name: 'strontium nitrate', type: 'nitrate', molarMass: 211.63, preferredFor: ['sol-gel'] },
  ],

  // Add more elements as needed...
}
```

### 3.2 Synthesis Method Conditions

```typescript
// src/lib/recipe/synthesis-methods.ts

export interface SynthesisMethod {
  id: string
  name: {
    en: string
    ko: string
  }
  description: {
    en: string
    ko: string
  }
  conditions: {
    temperatureRange: [number, number]  // °C
    timeRange: [number, number]          // hours
    atmosphere: string[]
    pressure?: string
  }
  steps: {
    name: string
    description: {
      en: string
      ko: string
    }
    temperature?: string
    time?: string
    atmosphere?: string
  }[]
  advantages: string[]
  disadvantages: string[]
  suitableFor: string[]  // material types
}

export const synthesisMethods: Record<string, SynthesisMethod> = {
  'solid-state': {
    id: 'solid-state',
    name: { en: 'Solid-State', ko: '고상 합성' },
    description: {
      en: 'High-temperature sintering of oxide precursors',
      ko: '산화물 전구체의 고온 소결'
    },
    conditions: {
      temperatureRange: [800, 1400],
      timeRange: [6, 48],
      atmosphere: ['air', 'Ar', 'N2', 'Ar/H2 (5%)', 'O2'],
    },
    steps: [
      {
        name: 'mixing',
        description: {
          en: 'Ball mill precursors with grinding media',
          ko: '볼밀로 전구체 혼합'
        },
        time: '2-6h',
      },
      {
        name: 'drying',
        description: {
          en: 'Dry the mixture',
          ko: '혼합물 건조'
        },
        temperature: '80-120°C',
        time: 'overnight',
      },
      {
        name: 'pelletizing',
        description: {
          en: 'Press into pellets (optional)',
          ko: '펠렛 성형 (선택)'
        },
      },
      {
        name: 'calcining',
        description: {
          en: 'Pre-calcine to decompose carbonates/nitrates',
          ko: '탄산염/질산염 분해를 위한 하소'
        },
        temperature: '500-700°C',
        time: '2-4h',
        atmosphere: 'air',
      },
      {
        name: 'sintering',
        description: {
          en: 'Final sintering at high temperature',
          ko: '고온 소결'
        },
        temperature: '900-1200°C',
        time: '12-24h',
      },
      {
        name: 'cooling',
        description: {
          en: 'Cool to room temperature',
          ko: '상온까지 냉각'
        },
      },
    ],
    advantages: ['Simple setup', 'Scalable', 'No solvents'],
    disadvantages: ['High temperature', 'Long time', 'Inhomogeneity'],
    suitableFor: ['oxides', 'ceramics', 'bulk materials'],
  },

  'sol-gel': {
    id: 'sol-gel',
    name: { en: 'Sol-Gel', ko: '솔-겔' },
    description: {
      en: 'Solution-based synthesis through gel formation',
      ko: '겔 형성을 통한 용액 기반 합성'
    },
    conditions: {
      temperatureRange: [400, 800],
      timeRange: [2, 12],
      atmosphere: ['air', 'N2'],
    },
    steps: [
      {
        name: 'dissolution',
        description: {
          en: 'Dissolve metal precursors in solvent',
          ko: '금속 전구체를 용매에 용해'
        },
      },
      {
        name: 'chelation',
        description: {
          en: 'Add chelating agent (citric acid, EDTA)',
          ko: '킬레이트제 첨가 (구연산, EDTA)'
        },
      },
      {
        name: 'gelation',
        description: {
          en: 'Heat to form gel',
          ko: '가열하여 겔 형성'
        },
        temperature: '80-150°C',
      },
      {
        name: 'drying',
        description: {
          en: 'Dry the gel',
          ko: '겔 건조'
        },
        temperature: '150-200°C',
      },
      {
        name: 'calcining',
        description: {
          en: 'Calcine to crystallize',
          ko: '결정화를 위한 하소'
        },
        temperature: '500-800°C',
        time: '2-6h',
      },
    ],
    advantages: ['Homogeneous', 'Lower temperature', 'Nanoparticles'],
    disadvantages: ['Complex', 'Organic residue', 'Shrinkage'],
    suitableFor: ['nanoparticles', 'thin films', 'mixed oxides'],
  },

  'hydrothermal': {
    id: 'hydrothermal',
    name: { en: 'Hydrothermal', ko: '수열 합성' },
    description: {
      en: 'Synthesis in aqueous solution under pressure',
      ko: '고압 수용액에서의 합성'
    },
    conditions: {
      temperatureRange: [100, 250],
      timeRange: [6, 48],
      atmosphere: ['autogenous pressure'],
      pressure: '1-100 atm',
    },
    steps: [
      {
        name: 'preparation',
        description: {
          en: 'Prepare aqueous precursor solution',
          ko: '수용액 전구체 준비'
        },
      },
      {
        name: 'pH-adjustment',
        description: {
          en: 'Adjust pH with NaOH/HCl',
          ko: 'NaOH/HCl로 pH 조절'
        },
      },
      {
        name: 'autoclave',
        description: {
          en: 'Transfer to Teflon-lined autoclave',
          ko: '테프론 라이닝 오토클레이브에 이송'
        },
      },
      {
        name: 'reaction',
        description: {
          en: 'Heat under autogenous pressure',
          ko: '자생 압력 하에서 가열'
        },
        temperature: '150-220°C',
        time: '12-24h',
      },
      {
        name: 'washing',
        description: {
          en: 'Wash with water and ethanol',
          ko: '물과 에탄올로 세척'
        },
      },
      {
        name: 'drying',
        description: {
          en: 'Dry at low temperature',
          ko: '저온 건조'
        },
        temperature: '60-80°C',
      },
    ],
    advantages: ['Low temperature', 'Crystalline', 'Controlled morphology'],
    disadvantages: ['Small batch', 'Equipment needed', 'Long time'],
    suitableFor: ['nanoparticles', 'nanowires', 'hydrated compounds'],
  },

  'solution': {
    id: 'solution',
    name: { en: 'Solution-Based', ko: '용액 기반' },
    description: {
      en: 'Wet chemical reduction or precipitation',
      ko: '습식 화학 환원 또는 침전'
    },
    conditions: {
      temperatureRange: [25, 100],
      timeRange: [0.5, 6],
      atmosphere: ['air', 'N2', 'Ar'],
    },
    steps: [
      {
        name: 'dissolution',
        description: {
          en: 'Dissolve metal salts in water/solvent',
          ko: '금속염을 물/용매에 용해'
        },
      },
      {
        name: 'reduction',
        description: {
          en: 'Add reducing agent (NaBH4, hydrazine, etc.)',
          ko: '환원제 첨가 (NaBH4, 히드라진 등)'
        },
      },
      {
        name: 'reaction',
        description: {
          en: 'Stir at temperature',
          ko: '온도에서 교반'
        },
        temperature: 'RT-100°C',
        time: '1-4h',
      },
      {
        name: 'separation',
        description: {
          en: 'Centrifuge or filter',
          ko: '원심분리 또는 여과'
        },
      },
      {
        name: 'washing',
        description: {
          en: 'Wash multiple times',
          ko: '여러 번 세척'
        },
      },
      {
        name: 'drying',
        description: {
          en: 'Dry under vacuum or inert gas',
          ko: '진공 또는 불활성 기체 하에서 건조'
        },
      },
    ],
    advantages: ['Room temperature', 'Fast', 'Simple'],
    disadvantages: ['Waste generation', 'Agglomeration', 'Size control'],
    suitableFor: ['metals', 'alloys', 'nanoparticles', 'catalysts'],
  },
}
```

### 3.3 Recipe Output Schema

```typescript
// src/lib/recipe/types.ts

export interface GeneratedRecipe {
  target: {
    formula: string
    name?: string
    elements: string[]
  }
  method: string
  precursors: {
    formula: string
    name: string
    amount?: string
    role: string
  }[]
  conditions: {
    temperature: string
    time: string
    atmosphere: string
    pressure?: string
  }
  procedure: {
    step: number
    action: string
    details: string
    temperature?: string
    time?: string
    tips?: string
  }[]
  characterization: string[]
  safetyNotes: string[]
  references: {
    material: string
    doi: string
    conditions: string
  }[]
  disclaimer: string
}
```

---

## 4. API Design

### 4.1 Recipe API Endpoint

```typescript
// src/app/api/recipe/route.ts

// Request
interface RecipeRequest {
  messages: {
    role: 'user' | 'assistant'
    content: string
  }[]
  language: 'ko' | 'en'
}

// Response - Method Selection
interface MethodSelectionResponse {
  type: 'method_selection'
  message: string
  methods: {
    id: string
    name: string
    description: string
  }[]
}

// Response - Generated Recipe
interface RecipeResponse {
  type: 'recipe'
  message: string
  recipe: GeneratedRecipe
}
```

### 4.2 Conversation State Machine

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   START     │────►│ AWAIT_TARGET    │────►│ AWAIT_METHOD    │
└─────────────┘     └─────────────────┘     └─────────────────┘
                           │                        │
                           │ (has target)           │ (has method)
                           ▼                        ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │ GENERATE_RECIPE │◄────│ CONFIRM_PARAMS  │
                    └─────────────────┘     └─────────────────┘
                           │                        ▲
                           │ (recipe done)          │ (modify request)
                           ▼                        │
                    ┌─────────────────┐─────────────┘
                    │   FOLLOW_UP     │
                    └─────────────────┘
```

---

## 5. UI Design

### 5.1 Recipe Mode in Agent

```
┌─────────────────────────────────────────────────────────────┐
│  Database Search                    MP, AFLOW, Synthesis     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Materials]  [Synthesis]  [Recipe ✨]              │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💬 What material do you want to synthesize?               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ User: IrRuNi 합금 합성하고 싶어                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AI: IrRuNi 합성을 도와드릴게요!                       │   │
│  │                                                      │   │
│  │ 어떤 합성 방법을 원하시나요?                          │   │
│  │                                                      │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │ │ Solid    │ │ Sol-Gel  │ │ Hydro    │ │ Solution │ │   │
│  │ │ State    │ │          │ │ thermal  │ │ Based    │ │   │
│  │ │ 고상합성 │ │ 솔-겔   │ │ 수열합성 │ │ 습식환원 │ │   │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [입력창...]                              [Generate]  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Method Selection Buttons (Interactive)

```typescript
// AI 메시지 내에 클릭 가능한 버튼 렌더링
interface MethodButton {
  id: string
  label: string
  sublabel: string
  onClick: () => void
}
```

---

## 6. Implementation Order

### Phase 1: Core Recipe Generation

| Step | Task | File |
|------|------|------|
| 1 | Element parser | `src/lib/recipe/element-parser.ts` |
| 2 | Precursor DB | `src/lib/recipe/precursor-db.ts` |
| 3 | Synthesis methods | `src/lib/recipe/synthesis-methods.ts` |
| 4 | Recipe generator | `src/lib/recipe/recipe-generator.ts` |
| 5 | API endpoint | `src/app/api/recipe/route.ts` |

### Phase 2: UI Integration

| Step | Task | File |
|------|------|------|
| 6 | Add Recipe mode tab | `src/components/DualChatInterface.tsx` |
| 7 | Method selection UI | (inline in chat) |
| 8 | i18n updates | `src/lib/i18n.ts` |

### Phase 3: Enhanced Features

| Step | Task | File |
|------|------|------|
| 9 | Reference finder | `src/lib/recipe/reference-finder.ts` |
| 10 | MCP tool | `mcp-server/src/index.ts` |

---

## 7. System Prompt for LLM

```typescript
const RECIPE_SYSTEM_PROMPT = `You are a materials science expert specializing in synthesis recipes.

When generating a synthesis recipe:
1. Use the provided precursor database for reagent selection
2. Follow the synthesis method's standard conditions
3. Include safety considerations
4. Provide step-by-step procedures with specific parameters
5. Reference similar materials from the dataset when available

Format your response as a structured recipe with:
- Precursors with amounts and roles
- Step-by-step procedure with temperatures and times
- Characterization recommendations
- Safety notes
- Disclaimer about verification

Always include: "⚠️ This is an AI-generated recipe. Please verify with literature before conducting experiments."
`
```

---

## 8. Success Criteria

- [ ] 목표 재료 입력 → 원소 파싱 정확도 95%+
- [ ] 4가지 합성 방법 지원
- [ ] 방법별 적절한 전구체 추천
- [ ] 상세 procedure 생성 (온도, 시간, 분위기)
- [ ] 유사 재료 DOI 참조 (데이터셋에서)
- [ ] 한/영 다국어 지원

---

## 9. Next Steps

1. Element parser 구현
2. Precursor DB 데이터 입력
3. API endpoint 구현
4. UI 모드 추가
5. 테스트 및 튜닝
