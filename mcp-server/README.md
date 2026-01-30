# Materials Project MCP Server

Materials Project API와 연동하는 MCP(Model Context Protocol) 서버입니다.
Claude Desktop/Code에서 자연어로 재료 데이터를 검색하고 조회할 수 있습니다.

## 설치

```bash
cd mcp-server
npm install
npm run build
```

## 사용 가능한 Tools

| Tool | 설명 | 예시 |
|------|------|------|
| `search_materials` | 화학식으로 검색 | "IrPt", "Fe2O3" |
| `search_by_elements` | 원소 조합으로 검색 | ["Ir", "Pt"], ["Li", "Co", "O"] |
| `get_material` | material_id로 상세 조회 | "mp-1234" |
| `search_by_band_gap` | band gap 범위로 검색 | 1.0 ~ 2.0 eV |
| `search_stable_materials` | 안정한 재료만 검색 | ["Fe", "O"] |

## Claude Desktop 설정

`claude_desktop_config.json` 파일 위치:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "materials": {
      "command": "node",
      "args": ["C:/Users/heeseung/Desktop/Proj/materials-data-portal/mcp-server/dist/index.js"],
      "env": {
        "MP_API_KEY": "0yGCr8U0LUHZbwvEzDqZxM2jh2TyraDl"
      }
    }
  }
}
```

## Claude Code 설정

프로젝트 루트에 `.mcp.json` 파일 생성:

```json
{
  "mcpServers": {
    "materials": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "env": {
        "MP_API_KEY": "0yGCr8U0LUHZbwvEzDqZxM2jh2TyraDl"
      }
    }
  }
}
```

## 사용 예시

Claude에게 이렇게 물어보세요:

- "IrPt 합금의 band gap과 formation energy 알려줘"
- "Li-Co-O 시스템에서 안정한 재료 찾아줘"
- "band gap이 1~2 eV인 반도체 재료 검색해줘"
- "mp-19017 재료의 상세 정보 보여줘"
