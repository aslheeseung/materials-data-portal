# Materials Data Portal - Build Guide

다른 컴퓨터에서 프로젝트를 빌드하고 실행하기 위한 가이드입니다.

---

## 📋 사전 요구사항

### 필수 설치
| 소프트웨어 | 버전 | 설치 링크 |
|-----------|------|----------|
| Node.js | 18+ | https://nodejs.org/ |
| Anaconda | 최신 | https://www.anaconda.com/download |
| Git | 최신 | https://git-scm.com/ |

### API 키 발급
1. **Materials Project API Key**
   - https://materialsproject.org/ 가입
   - Dashboard → API → Generate API Key

2. **OpenAI API Key**
   - https://platform.openai.com/ 가입
   - API Keys → Create new secret key

---

## 🚀 설치 단계

### Step 1: 저장소 클론

```bash
git clone https://github.com/aslheeseung/materials-data-portal.git
cd materials-data-portal
```

### Step 2: 웹 포털 설치

```bash
# Node.js 의존성 설치
npm install
```

### Step 3: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# .env.local
OPENAI_API_KEY=sk-your-openai-api-key
MP_API_KEY=your-materials-project-api-key
```

### Step 4: Python 환경 설정

```bash
# Conda 환경 생성
conda create -n materialsPortal python=3.10 -y

# 환경 활성화
conda activate materialsPortal

# Python 의존성 설치
cd python-server
pip install -r requirements.txt

# 루트로 돌아가기
cd ..
```

### Step 5: MCP 서버 빌드 (선택사항)

Claude Code 연동이 필요한 경우:

```bash
cd mcp-server
npm install
npm run build
cd ..
```

---

## ▶️ 실행 방법

### 터미널 1: 웹 포털

```bash
npm run dev
```
→ http://localhost:3000

### 터미널 2: Python 계산 서버

```bash
conda activate materialsPortal
cd python-server

# Windows PowerShell
$env:MP_API_KEY = "your-materials-project-api-key"

# Mac/Linux
export MP_API_KEY="your-materials-project-api-key"

python -m uvicorn main:app --port 8000
```
→ http://localhost:8000

---

## 📁 프로젝트 구조

```
materials-data-portal/
├── src/                      # Next.js 웹 포털
│   ├── app/
│   │   ├── page.tsx          # 홈 (AI 검색)
│   │   ├── agent/            # Agent 페이지
│   │   ├── lab/              # Lab 페이지 (Multi-Agent)
│   │   ├── synthesis/        # 합성 데이터베이스
│   │   └── api/              # API Routes
│   ├── components/           # React 컴포넌트
│   ├── lib/                  # 유틸리티
│   │   ├── materials-api.ts  # MP API 클라이언트
│   │   ├── compute-api.ts    # Python 서버 클라이언트
│   │   └── research/         # 연구 모드 유틸
│   └── data/                 # 정적 데이터
│
├── python-server/            # Python 계산 서버
│   ├── main.py               # FastAPI 서버
│   └── requirements.txt      # Python 의존성
│
├── mcp-server/               # MCP 서버 (Claude Code용)
│   ├── src/
│   │   └── index.ts          # MCP 서버 메인
│   └── dist/                 # 빌드 결과물
│
├── docs/                     # 문서
├── .env.local                # 환경 변수 (직접 생성)
└── package.json              # Node.js 설정
```

---

## 🔧 주요 기능별 설정

### 1. 기본 검색 (홈페이지)
- 필요: `OPENAI_API_KEY`, `MP_API_KEY`
- Python 서버: 불필요

### 2. Lab 페이지 (Multi-Agent)
- 필요: `OPENAI_API_KEY`, `MP_API_KEY`
- Python 서버: 선택 (Compute Agent 사용 시 필요)

### 3. MLIP 계산
- 필요: Python 서버 + UPET 설치
- 첫 실행 시 모델 다운로드 (~1GB)

```bash
# UPET는 requirements.txt에 포함됨
# 첫 MLIP 계산 요청 시 자동으로 모델 다운로드
```

---

## 🌐 배포

### Vercel 배포 (웹 포털)

1. GitHub 저장소 연결
2. 환경 변수 설정:
   - `OPENAI_API_KEY`
   - `MP_API_KEY`
3. 빌드 명령어: `npm run build`
4. 출력 디렉토리: `.next`

**주의**: Python 서버는 Vercel에 배포되지 않습니다. 별도 서버 필요.

### Python 서버 배포 옵션

- **로컬**: 개발/테스트용
- **Railway/Render**: 간단한 클라우드 배포
- **AWS EC2/GCP**: 프로덕션 배포

---

## ❗ 트러블슈팅

### "Module not found" 오류
```bash
npm install  # Node.js 모듈
pip install -r requirements.txt  # Python 모듈
```

### "OPENAI_API_KEY not found"
```bash
# .env.local 파일 확인
cat .env.local
```

### "계산 서버 연결 오류"
```bash
# Python 서버 실행 확인
curl http://localhost:8000/health
```

### "MP API 401 Unauthorized"
```bash
# API 키 환경변수 확인
echo $env:MP_API_KEY  # PowerShell
echo $MP_API_KEY      # Bash
```

### "UPET not available"
```bash
conda activate materialsPortal
pip install upet
```

### Conda 환경 문제
```bash
# 환경 삭제 후 재생성
conda remove -n materialsPortal --all
conda create -n materialsPortal python=3.10 -y
conda activate materialsPortal
pip install -r python-server/requirements.txt
```

---

## 📝 빠른 시작 요약

```bash
# 1. 클론
git clone https://github.com/aslheeseung/materials-data-portal.git
cd materials-data-portal

# 2. Node.js 설치
npm install

# 3. 환경 변수 (.env.local 생성)
echo "OPENAI_API_KEY=sk-xxx" >> .env.local
echo "MP_API_KEY=xxx" >> .env.local

# 4. Python 환경
conda create -n materialsPortal python=3.10 -y
conda activate materialsPortal
pip install -r python-server/requirements.txt

# 5. 실행 (터미널 2개)
# 터미널 1:
npm run dev

# 터미널 2:
conda activate materialsPortal
cd python-server
$env:MP_API_KEY = "your-key"
python -m uvicorn main:app --port 8000
```

---

*Last Updated: 2026-02-01*
