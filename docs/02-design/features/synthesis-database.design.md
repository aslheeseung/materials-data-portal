# Design: Synthesis Database Integration

## Overview

| Item | Description |
|------|-------------|
| Feature | Synthesis Database (Text-Mined Reactions) 통합 |
| Plan Reference | `docs/01-plan/features/synthesis-database.plan.md` |
| Created | 2026-01-31 |
| Status | Design |

---

## 1. Data Schema

### 1.1 Source Schema (Ceder Dataset)

```typescript
// Root Entry
interface ReactionEntry {
  doi: string;                      // "10.1016/j.jpowsour.2019.01.001"
  paragraph_string: string;         // Original text (max 100 chars)
  synthesis_type: string;           // "solid-state" | "sol-gel"
  reaction_string: string;          // "Li2CO3 + Co3O4 → LiCoO2"
  reaction: Formula;
  targets_string: string[];         // ["LiCoO2"]
  target: Material;
  precursors: Material[];
  operations: Operation[];
}

// Material (Target/Precursor)
interface Material {
  material_string: string;          // Original notation
  material_formula: string;         // "LiCoO2"
  material_name: string;            // "lithium cobalt oxide"
  phase?: string;                   // "powder" | "pellet"
  is_acronym: boolean;
  composition: Composition[];
  additives: string[];              // Dopants
  oxygen_deficiency?: string;
}

// Operation (Processing Step)
interface Operation {
  type: string;                     // "Heating" | "Mixing" | "Grinding"
  token: string;                    // "calcined" | "sintered"
  conditions: Conditions;
}

// Conditions
interface Conditions {
  heating_temperature?: Value[];    // [{min: 800, max: 900, units: "°C"}]
  heating_time?: Value[];           // [{min: 6, max: 12, units: "h"}]
  heating_atmosphere?: string;      // "air" | "O2" | "N2"
  mixing_device?: string;           // "ball mill"
  mixing_media?: string;            // "ethanol"
}

// Value (Temperature/Time)
interface Value {
  min_value: number;
  max_value: number;
  values: number[];
  units: string;
}
```

### 1.2 Simplified Schema (For MCP/UI)

```typescript
// Simplified for search and display
interface SynthesisRecipe {
  id: string;                       // Generated unique ID
  doi: string;

  // Target
  target_formula: string;           // "LiCoO2"
  target_name: string;              // "lithium cobalt oxide"

  // Precursors
  precursors: {
    formula: string;
    name?: string;
  }[];

  // Conditions (flattened)
  temperature_min?: number;         // °C
  temperature_max?: number;         // °C
  time_min?: number;                // hours
  time_max?: number;                // hours
  atmosphere?: string;

  // Operations summary
  operations: string[];             // ["Mixing", "Calcining", "Sintering"]

  // Metadata
  synthesis_type: "solid-state" | "sol-gel";
}
```

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Materials Data Portal                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Web UI     │    │   API Routes │    │  MCP Server  │  │
│  │              │◄──►│              │    │              │  │
│  │ /synthesis   │    │ /api/synth   │    │ synthesis    │  │
│  │              │    │              │    │ tools        │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              src/data/synthesis-data.ts              │   │
│  │              (Processed JSON Dataset)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
materials-data-portal/
├── src/
│   ├── data/
│   │   ├── datasets.ts              # 기존 (ICSD 등록 업데이트)
│   │   └── synthesis-data.ts        # 🆕 합성 레시피 데이터
│   │
│   ├── lib/
│   │   └── synthesis-api.ts         # 🆕 검색 유틸리티
│   │
│   ├── app/
│   │   ├── synthesis/
│   │   │   └── page.tsx             # 🆕 합성 레시피 페이지
│   │   └── api/
│   │       └── synthesis/
│   │           └── route.ts         # 🆕 API 엔드포인트
│   │
│   └── components/
│       └── SynthesisCard.tsx        # 🆕 레시피 카드 컴포넌트
│
└── mcp-server/
    └── src/
        ├── index.ts                 # 수정: synthesis tools 추가
        └── api/
            └── synthesis-data.ts    # 🆕 합성 데이터 로더
```

---

## 3. MCP Tools Design

### 3.1 Tool Definitions

```typescript
// Tool 1: search_synthesis_recipes
{
  name: 'search_synthesis_recipes',
  description: 'Search solid-state synthesis recipes by target material formula. Returns synthesis conditions including precursors, temperature, time, and atmosphere.',
  inputSchema: {
    type: 'object',
    properties: {
      formula: {
        type: 'string',
        description: 'Target material formula (e.g., "LiCoO2", "BaTiO3")'
      },
      synthesis_type: {
        type: 'string',
        enum: ['solid-state', 'sol-gel', 'all'],
        description: 'Filter by synthesis method',
        default: 'all'
      },
      limit: {
        type: 'number',
        description: 'Maximum results (default: 10)',
        default: 10
      }
    },
    required: ['formula']
  }
}

// Tool 2: search_by_precursor
{
  name: 'search_by_precursor',
  description: 'Find synthesis recipes that use a specific precursor material. Useful for exploring reaction pathways.',
  inputSchema: {
    type: 'object',
    properties: {
      precursor: {
        type: 'string',
        description: 'Precursor formula (e.g., "Li2CO3", "TiO2")'
      },
      limit: {
        type: 'number',
        default: 10
      }
    },
    required: ['precursor']
  }
}

// Tool 3: search_by_temperature
{
  name: 'search_by_temperature',
  description: 'Find synthesis recipes within a specific temperature range.',
  inputSchema: {
    type: 'object',
    properties: {
      min_temp: {
        type: 'number',
        description: 'Minimum temperature in °C'
      },
      max_temp: {
        type: 'number',
        description: 'Maximum temperature in °C'
      },
      elements: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: filter by elements in target'
      },
      limit: {
        type: 'number',
        default: 10
      }
    },
    required: ['min_temp', 'max_temp']
  }
}
```

### 3.2 Response Format

```typescript
// Example response for "LiCoO2 합성 레시피"
function formatSynthesisRecipe(recipe: SynthesisRecipe): string {
  return `
**${recipe.target_formula}** (${recipe.synthesis_type})
DOI: ${recipe.doi}

📦 Precursors:
${recipe.precursors.map(p => `  - ${p.formula}`).join('\n')}

🔥 Conditions:
  - Temperature: ${recipe.temperature_min}-${recipe.temperature_max}°C
  - Time: ${recipe.time_min}-${recipe.time_max}h
  - Atmosphere: ${recipe.atmosphere || 'Not specified'}

⚙️ Operations: ${recipe.operations.join(' → ')}
  `.trim();
}
```

---

## 4. UI Design

### 4.1 Synthesis Search Page (`/synthesis`)

```
┌─────────────────────────────────────────────────────────────┐
│  Materials Data Portal          [Home] [Datasets] [Synth]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🧪 Synthesis Recipe Search                                 │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Target Formula    ] [Precursor        ] [🔍 Search]       │
│                                                             │
│  Filters:                                                   │
│  ○ All  ● Solid-State  ○ Sol-Gel                           │
│  Temperature: [300] - [1200] °C                             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Found 15 recipes for "LiCoO2"                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ LiCoO2 (Solid-State)                    DOI: 10...  │   │
│  │                                                     │   │
│  │ Precursors: Li2CO3, Co3O4                          │   │
│  │ Temperature: 800-900°C | Time: 12h                 │   │
│  │ Atmosphere: Air                                     │   │
│  │ Operations: Mixing → Calcining → Sintering         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 SynthesisCard Component

```typescript
// components/SynthesisCard.tsx
interface SynthesisCardProps {
  recipe: SynthesisRecipe;
}

export function SynthesisCard({ recipe }: SynthesisCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">{recipe.target_formula}</h3>
        <span className="text-xs bg-blue-100 px-2 py-1 rounded">
          {recipe.synthesis_type}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div>
          <span className="font-medium">Precursors:</span>
          {recipe.precursors.map(p => p.formula).join(', ')}
        </div>

        <div className="flex gap-4">
          <span>🔥 {recipe.temperature_min}-{recipe.temperature_max}°C</span>
          <span>⏱️ {recipe.time_min}-{recipe.time_max}h</span>
          {recipe.atmosphere && <span>💨 {recipe.atmosphere}</span>}
        </div>

        <div className="text-gray-500">
          {recipe.operations.join(' → ')}
        </div>
      </div>

      <a href={`https://doi.org/${recipe.doi}`}
         className="text-blue-600 text-xs mt-2 block">
        View Paper →
      </a>
    </div>
  );
}
```

---

## 5. Implementation Order

### Phase 1: Data & MCP (Priority)

| Step | Task | File |
|------|------|------|
| 1 | Dataset 다운로드 & 파싱 스크립트 | `scripts/parse-synthesis.ts` |
| 2 | Simplified JSON 생성 | `mcp-server/data/synthesis.json` |
| 3 | MCP Tool 구현 | `mcp-server/src/index.ts` |
| 4 | 테스트 | Claude에서 직접 쿼리 |

### Phase 2: Web UI

| Step | Task | File |
|------|------|------|
| 5 | API Route 생성 | `src/app/api/synthesis/route.ts` |
| 6 | Synthesis 페이지 | `src/app/synthesis/page.tsx` |
| 7 | SynthesisCard 컴포넌트 | `src/components/SynthesisCard.tsx` |
| 8 | 네비게이션 업데이트 | `src/app/layout.tsx` |

---

## 6. Data Processing

### 6.1 Download & Parse Script

```typescript
// scripts/parse-synthesis.ts
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// 1. Download from GitHub
const DATASET_URL = 'https://github.com/CederGroupHub/text-mined-synthesis_public/raw/master/data/solid-state_dataset_20200713.json.xz';

// 2. Decompress XZ
execSync(`curl -L ${DATASET_URL} | xz -d > raw-data.json`);

// 3. Parse and simplify
const rawData = JSON.parse(readFileSync('raw-data.json', 'utf-8'));
const simplified = rawData.map(entry => ({
  id: generateId(entry),
  doi: entry.doi,
  target_formula: entry.target?.material_formula || entry.targets_string[0],
  target_name: entry.target?.material_name || '',
  precursors: entry.precursors.map(p => ({
    formula: p.material_formula,
    name: p.material_name
  })),
  temperature_min: extractTemp(entry, 'min'),
  temperature_max: extractTemp(entry, 'max'),
  time_min: extractTime(entry, 'min'),
  time_max: extractTime(entry, 'max'),
  atmosphere: extractAtmosphere(entry),
  operations: entry.operations.map(op => op.type),
  synthesis_type: entry.synthesis_type
}));

// 4. Save
writeFileSync('mcp-server/data/synthesis.json', JSON.stringify(simplified));
```

### 6.2 Expected Output Size

| Dataset | Entries | Estimated JSON Size |
|---------|---------|---------------------|
| Solid-State | 31,782 | ~8 MB |
| Sol-Gel | 9,518 | ~2.5 MB |
| **Total** | **41,300** | **~10.5 MB** |

---

## 7. Success Criteria

- [ ] 30,000+ synthesis recipes MCP로 검색 가능
- [ ] Target formula, precursor, temperature로 검색 지원
- [ ] Web UI에서 합성 레시피 브라우징
- [ ] DOI 링크로 원본 논문 접근

---

## 8. Dependencies

```json
{
  "devDependencies": {
    "xz": "^4.0.4"  // For decompressing .xz files
  }
}
```

---

## Next Steps

1. `/pdca do synthesis-database` - 구현 시작
2. Dataset 다운로드 및 파싱
3. MCP Tools 구현
