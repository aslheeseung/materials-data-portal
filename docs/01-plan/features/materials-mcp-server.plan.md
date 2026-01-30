# Plan: Materials Project MCP Server

> 작성일: 2026-01-31
> 상태: Draft

## 1. 개요

### 1.1 기능 설명
Materials Project API와 연동하여 Claude Desktop/Code에서 재료 데이터를 검색하고 조회할 수 있는 MCP(Model Context Protocol) 서버

### 1.2 목표
- 자연어로 재료 검색 (예: "IrPt 합금 찾아줘")
- 재료 속성 조회 (band gap, formation energy 등)
- 결정 구조 정보 제공
- Claude와 대화하며 재료 탐색

### 1.3 사용 시나리오
```
User: "IrPt 합금의 band gap과 formation energy를 알려줘"
Claude: [MCP Tool 호출] → Materials Project API 검색
Claude: "IrPt 관련 재료를 3개 찾았습니다..."
```

## 2. 요구사항

### 2.1 MCP Tools (필수)

| Tool Name | 설명 | Parameters |
|-----------|------|------------|
| `search_materials` | 화학식으로 재료 검색 | formula, limit |
| `get_material` | material_id로 상세 정보 | material_id |
| `search_by_elements` | 원소 조합으로 검색 | elements[], limit |
| `get_properties` | 특정 속성 조회 | material_id, properties[] |

### 2.2 MCP Resources (선택)

| Resource | 설명 |
|----------|------|
| `materials://recent` | 최근 검색한 재료 목록 |
| `materials://favorites` | 즐겨찾기 재료 |

## 3. 기술 스택

```
Runtime:     Node.js 20+
Language:    TypeScript
MCP SDK:     @modelcontextprotocol/sdk
HTTP Client: fetch (built-in)
```

## 4. Materials Project API

### 4.1 API 정보
- Base URL: `https://api.materialsproject.org/v2`
- 인증: API Key (무료 발급)
- Rate Limit: 분당 100 요청

### 4.2 주요 Endpoints

| Endpoint | 용도 |
|----------|------|
| `/materials/summary` | 재료 검색 및 요약 |
| `/materials/{material_id}` | 상세 정보 |
| `/materials/core` | 핵심 속성만 조회 |

### 4.3 API Key 발급
1. https://materialsproject.org 가입
2. Dashboard → API → Generate API Key

## 5. 프로젝트 구조

```
materials-mcp-server/
├── src/
│   ├── index.ts           # MCP 서버 진입점
│   ├── tools/
│   │   ├── search.ts      # 검색 도구들
│   │   └── properties.ts  # 속성 조회 도구
│   ├── api/
│   │   └── materials-project.ts  # MP API 클라이언트
│   └── types/
│       └── materials.ts   # 타입 정의
├── package.json
├── tsconfig.json
└── README.md
```

## 6. Claude 연동 방법

### 6.1 Claude Desktop 설정
`claude_desktop_config.json`에 추가:
```json
{
  "mcpServers": {
    "materials": {
      "command": "node",
      "args": ["path/to/materials-mcp-server/dist/index.js"],
      "env": {
        "MP_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 6.2 Claude Code 설정
`.claude/settings.json`에 추가

## 7. 범위

### 7.1 포함 (v1.0)
- Materials Project API 연동
- 기본 검색 및 조회 Tools
- TypeScript MCP 서버

### 7.2 제외 (추후 확장)
- 다른 데이터셋 (AFLOW, NOMAD 등)
- 결정 구조 시각화
- 데이터 다운로드/내보내기

## 8. 다음 단계

`/pdca design materials-mcp-server` 로 상세 설계
