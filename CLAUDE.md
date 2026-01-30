# Materials Data Portal

## Project Level
**Dynamic** - Web Portal + MCP Server

## Overview
Materials Science 연구자를 위한 오픈 데이터셋 포털 + AI Agent

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- MCP Server (Materials Project API)

## Project Structure
```
materials-data-portal/
├── src/                    # 웹 포털
│   ├── app/
│   ├── components/
│   └── data/
├── mcp-server/             # MCP 서버
│   ├── src/
│   │   ├── index.ts        # MCP 서버 메인
│   │   ├── api/            # Materials Project API 클라이언트
│   │   └── types/          # 타입 정의
│   └── dist/               # 빌드 결과물
├── .mcp.json               # MCP 설정 (Claude Code용)
└── package.json
```

## Commands

### Web Portal
```bash
npm install
npm run dev    # http://localhost:3000
```

### MCP Server
```bash
cd mcp-server
npm install
npm run build
```

## MCP Tools

| Tool | 설명 |
|------|------|
| `search_materials` | 화학식으로 재료 검색 |
| `search_by_elements` | 원소 조합으로 검색 |
| `get_material` | material_id로 상세 조회 |
| `search_by_band_gap` | band gap 범위로 검색 |
| `search_stable_materials` | 안정한 재료만 검색 |

## 사용 예시

Claude에게:
- "IrPt 합금 찾아줘"
- "Li-Co-O 시스템에서 안정한 재료 검색"
- "band gap 1~2 eV인 반도체 찾아줘"
