# FIND-ME Frontend

진로를 정하지 못한 중·고등학생이 매일의 작은 탐색으로 관심사를 발견하고, 공부 방향과 학과·직업까지 연결해 가도록 돕는 AI 진로 탐색 서비스 **FIND-ME**의 프론트엔드 저장소입니다.

2026 AI 우왕톤 · 주제 "AI는 동료가 될 수 있을까?" 출품작 (TEAM 50)

> 백엔드는 별도 저장소(`WOOWANGTHON_TEAM_50_BE`)에서 관리합니다.

## 주요 화면

| 화면 | 경로 | 설명 |
| --- | --- | --- |
| 로그인 | `/` | 로그인 및 회원가입 |
| 초기 프로필 | `/profile` | 관심사, 취미 등을 체크리스트로 입력 |
| 오늘의 키워드 | `/keywords` | 키워드 카드와 관련 정보 열람, "더 받을까요?" 응답 |
| AI 대화 | `/chat` | AI와 대화하며 진로 방향 좁히기 |
| 진로 피드 | `/feed` | 진로 관련 글과 학과·직업 추천 |

## 기술 스택

- React
- Vite
- React Router (`react-router-dom`)

## 시작하기

### 사전 준비

- [Node.js](https://nodejs.org) LTS 버전
- Git

### 실행 방법

```bash
git clone <저장소 주소>
cd WOOWANGTHON_TEAM_50_FE
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`을 열면 화면이 나타납니다.

### 주요 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm install` | 필요한 라이브러리 설치 |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 배포용 빌드 생성 |

## 폴더 구조

```text
src/
├─ pages/        # 화면 단위 파일 (Login, Profile, KeywordCard, Chat, Feed)
├─ components/   # 여러 화면에서 쓰는 공통 컴포넌트
├─ api/          # 백엔드 API 호출 함수
├─ App.jsx       # 라우팅 설정
└─ main.jsx      # 진입점
```

## 협업 규칙

- `main`에 바로 푸시하지 않고, 작업마다 브랜치(`feature/작업이름`)를 만들어 Pull Request로 합칩니다.
- 작업을 시작하기 전에 항상 `git pull origin main`으로 최신 코드를 받습니다.
- 담당 화면을 나눠서 작업하고, `App.jsx`를 수정하면 팀원에게 알립니다.
- 라이브러리를 새로 설치하면 `package.json`과 `package-lock.json`을 함께 커밋합니다.
- Public 저장소이므로 API 키, 비밀번호, 토큰은 코드에 넣지 않습니다.

## 팀

| 역할 | 인원 |
| --- | --- |
| Frontend | 2명 |