# Plan: Synthesis Database Integration

## Overview

| Item | Description |
|------|-------------|
| Feature | Synthesis Database (Text-Mined Reactions) 통합 |
| Priority | High |
| Created | 2026-01-31 |
| Status | Planning |

## Background

현재 Materials Data Portal은 DFT 계산 데이터 (Materials Project, AFLOW, OQMD)와 결정 구조 데이터 (COD)를 지원합니다.
재료 합성 레시피 데이터를 추가하여 연구자들이 **합성 조건까지 검색**할 수 있도록 확장합니다.

## Target Databases

### 1. Ceder Group Text-Mined Synthesis (Primary)

| Item | Value |
|------|-------|
| URL | https://github.com/CederGroupHub/text-mined-synthesis_public |
| Paper | [Scientific Data (2019)](https://www.nature.com/articles/s41597-019-0224-1) |
| Size | 31,782 solid-state reactions + 9,518 sol-gel reactions |
| Format | JSON/CSV |
| License | Open Source |

**데이터 구조:**
- Target material (목표 재료)
- Precursors (전구체)
- Temperature (온도)
- Time (시간)
- Atmosphere (분위기)
- Operations (공정 순서)

### 2. 2025 LLM-Extracted Dataset (Optional)

| Item | Value |
|------|-------|
| URL | [ChemRxiv Preprint](https://chemrxiv.org/engage/chemrxiv/article-details/682fdf931a8f9bdab557ec7c) |
| Size | 80,823 syntheses (with impurity phases) |
| Status | Preprint (2025-05) |

### 3. Matscholar API (Future)

| Item | Value |
|------|-------|
| URL | https://matscholar.com |
| Status | API Redesign 중 - 현재 불가 |
| Note | 추후 재개되면 통합 고려 |

## Implementation Scope

### Phase 1: Static Data Integration
1. Ceder Synthesis Dataset 다운로드 및 파싱
2. `src/data/synthesis-recipes.ts` 데이터 파일 생성
3. Web Portal UI에 합성 레시피 검색 추가

### Phase 2: MCP Tool 추가
1. `search_synthesis_recipes` - 재료명으로 합성 레시피 검색
2. `get_synthesis_conditions` - 특정 재료의 합성 조건 조회
3. `search_by_precursor` - 전구체로 역검색

## Technical Approach

```
Option A: Static JSON (Recommended for Phase 1)
- GitHub에서 dataset 다운로드
- JSON 파싱하여 src/data/에 저장
- Client-side 검색

Option B: Backend API (Phase 2)
- MCP Server에 synthesis tools 추가
- 대용량 데이터 처리
```

## MCP Tools 설계 (Phase 2)

```typescript
// search_synthesis_recipes
{
  name: 'search_synthesis_recipes',
  description: 'Search solid-state synthesis recipes for a target material',
  inputSchema: {
    properties: {
      target_material: { type: 'string' },  // e.g., "LiCoO2"
      limit: { type: 'number', default: 10 }
    }
  }
}

// search_by_precursor
{
  name: 'search_by_precursor',
  description: 'Find syntheses using specific precursor materials',
  inputSchema: {
    properties: {
      precursor: { type: 'string' },  // e.g., "Li2CO3"
      limit: { type: 'number', default: 10 }
    }
  }
}
```

## Expected Output

```
"LiCoO2 합성 레시피 찾아줘"

→ Found 15 synthesis recipes for LiCoO2:

**Recipe 1** (DOI: 10.1016/...)
  - Precursors: Li2CO3, Co3O4
  - Temperature: 900°C
  - Time: 12h
  - Atmosphere: Air

**Recipe 2** (DOI: 10.1021/...)
  - Precursors: LiOH, CoO
  - Temperature: 800°C
  - Time: 24h
  - Atmosphere: O2
```

## Success Criteria

- [ ] 30,000+ synthesis recipes 검색 가능
- [ ] 재료명, 전구체, 온도 범위로 검색
- [ ] MCP Tool로 Claude에서 직접 쿼리 가능

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 대용량 데이터 (40K+ recipes) | Phase 1은 client-side, Phase 2에서 서버 처리 |
| 데이터 형식 불일치 | 파싱 스크립트로 표준화 |
| Matscholar API 불가 | Ceder Dataset으로 대체 (충분한 커버리지) |

## Next Steps

1. `/pdca design synthesis-database` - 상세 설계
2. Ceder Dataset 다운로드 및 분석
3. 데이터 스키마 정의

---

## Sources

- [Ceder Group Text-Mined Synthesis](https://github.com/CederGroupHub/text-mined-synthesis_public)
- [Text-mined dataset paper (2019)](https://www.nature.com/articles/s41597-019-0224-1)
- [2025 LLM Dataset (ChemRxiv)](https://chemrxiv.org/engage/chemrxiv/article-details/682fdf931a8f9bdab557ec7c)
- [Matscholar](https://github.com/materialsintelligence/matscholar)
