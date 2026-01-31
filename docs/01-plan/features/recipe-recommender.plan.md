# Plan: Recipe Recommender

## Overview

| Item | Description |
|------|-------------|
| Feature | AI-based Synthesis Recipe Recommender |
| Priority | High |
| Created | 2026-01-31 |
| Status | Planning |

## Background

현재 Synthesis 검색은 **기존 데이터셋에서 검색**만 가능합니다.
연구자가 **새로운 재료**(예: IrRuNi)를 합성하고 싶을 때, 해당 재료가 데이터셋에 없으면 도움이 되지 않습니다.

**Recipe Recommender**는:
1. 목표 재료 입력
2. 합성 방법 선택 (대화형)
3. AI가 레시피 생성 (유사 재료 참조)

## User Flow

```
사용자: "IrRuNi 합금 합성하고 싶어"

AI: "IrRuNi 합성을 도와드릴게요. 어떤 합성 방법을 원하시나요?

    1. **Solid-State** - 고온 소결, 대량 합성에 적합
    2. **Sol-Gel** - 균일한 조성, 낮은 온도
    3. **Hydrothermal** - 나노입자, 수열 조건
    4. **Solution-Based** - 습식 환원, 간단한 설정"

사용자: "Solid State로 해줘"

AI: "**IrRuNi Alloy - Solid State Synthesis Recipe**

📦 **Precursors:**
- IrO2 (iridium oxide) - 1 mol
- RuO2 (ruthenium oxide) - 1 mol
- NiO (nickel oxide) - 1 mol

⚙️ **Procedure:**
1. Weigh precursors in stoichiometric ratio
2. Ball mill in ethanol (200 rpm, 6h)
3. Dry at 80°C overnight
4. Pelletize at 200 MPa
5. Calcine at 600°C (2h, air) - decompose carbonates
6. Reduce at 900-1100°C (12-24h, Ar/H2 5%)
7. Cool to RT under Ar atmosphere

🔬 **Characterization:**
- XRD: confirm alloy phase
- SEM-EDS: verify composition
- BET: surface area

📚 **Similar References:**
- IrRu alloy: DOI 10.xxx (800°C, 12h)
- RuNi alloy: DOI 10.xxx (950°C, 24h)"
```

## Technical Approach

### Option A: LLM API 직접 호출 (Recommended)
- OpenAI/Claude API로 레시피 생성
- System prompt에 합성 전문 지식 포함
- 유사 재료 데이터로 grounding

### Option B: Rule-based + Template
- 합성 방법별 템플릿 준비
- 원소별 전구체 매핑 테이블
- 덜 유연하지만 API 비용 없음

## Implementation Scope

### Phase 1: 대화형 Recipe Recommender
1. Agent에 "Recipe" 모드 추가
2. 목표 재료 → 합성 방법 질문 flow
3. AI 레시피 생성 (Claude API)
4. 유사 재료 참조 (Synthesis 데이터셋)

### Phase 2: 고급 기능 (Optional)
1. 원소별 전구체 추천 DB
2. 온도/시간 최적화 제안
3. 안전 주의사항 자동 추가
4. PDF 레시피 내보내기

## Data Requirements

### 1. 원소-전구체 매핑
```typescript
const precursorMap: Record<string, string[]> = {
  'Li': ['Li2CO3', 'LiOH', 'LiNO3', 'Li2O'],
  'Co': ['Co3O4', 'CoO', 'Co(NO3)2', 'CoCO3'],
  'Ni': ['NiO', 'Ni(NO3)2', 'NiCO3', 'Ni(OH)2'],
  'Fe': ['Fe2O3', 'FeO', 'Fe3O4', 'Fe(NO3)3'],
  'Ti': ['TiO2', 'Ti(OC4H9)4'],
  'Ir': ['IrO2', 'IrCl3', 'H2IrCl6'],
  'Ru': ['RuO2', 'RuCl3', 'Ru(NO)(NO3)3'],
  // ... more elements
}
```

### 2. 합성 방법별 조건
```typescript
const synthesisConditions = {
  'solid-state': {
    tempRange: [800, 1400],
    timeRange: [6, 48],
    atmosphere: ['air', 'Ar', 'N2', 'Ar/H2'],
    steps: ['mixing', 'calcining', 'sintering']
  },
  'sol-gel': {
    tempRange: [400, 800],
    timeRange: [2, 12],
    atmosphere: ['air', 'N2'],
    steps: ['gelation', 'drying', 'calcining']
  },
  // ...
}
```

## API Design

### Endpoint: `/api/recipe`

```typescript
// Request
{
  messages: [
    { role: 'user', content: 'IrRuNi 합금 합성' },
    { role: 'assistant', content: '어떤 방법?' },
    { role: 'user', content: 'Solid State' }
  ],
  language: 'ko'
}

// Response
{
  message: "**IrRuNi Solid State Recipe**\n...",
  recipe: {
    target: 'IrRuNi',
    method: 'solid-state',
    precursors: [...],
    conditions: {...},
    procedure: [...],
    references: [...]
  }
}
```

## Success Criteria

- [ ] 목표 재료 입력 → 합성 방법 선택 대화 flow
- [ ] 4가지 합성 방법 지원 (solid-state, sol-gel, hydrothermal, solution)
- [ ] AI 생성 레시피 (전구체, 온도, 시간, 절차)
- [ ] 유사 재료 DOI 참조

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI hallucination | 유사 재료 데이터로 grounding |
| 잘못된 레시피 | 경고 문구: "실험 전 문헌 확인 필요" |
| API 비용 | Rate limiting, 캐싱 |

## Next Steps

1. `/pdca design recipe-recommender` - 상세 설계
2. 원소-전구체 매핑 데이터 구축
3. API 엔드포인트 구현
4. Agent UI 모드 추가
