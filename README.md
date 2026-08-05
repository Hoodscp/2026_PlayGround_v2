# 🎮 PlayGround v2

**PlayGround v2**는 최신 웹 기술(Next.js 16 Turbopack, React 19, Layered HTML5 Canvas, Web Audio API)을 기반으로 구현된 **유기적 액체(Liquid Concept) 인터랙티브 아케이드 & 모션 라보(Motion Lab) 미니게임 플랫폼**입니다.

---

## 🌐 라우트 및 기능 (Routes & Features)

- **`http://localhost:3000/`** (홈 / 랜딩 페이지)
  - 액체 로고 애니메이션(`playground-logo.tsx`), 히어로 섹션(`hero.tsx`), 아케이드 모드 및 모션 랩 빠른 바로가기 지원.
- **`http://localhost:3000/play`** (아케이드 플레이 그라운드)
  - 4종의 액체 컨셉 아케이드 게임 선택 및 샌드박스 플레이 기능 지원 (`play-page.tsx`, `game-selector.tsx`).
- **`http://localhost:3000/motion`** (모션 랩 / Motion Lab)
  - SVG 액체 구이 필터(Gooey Filter) 파라미터(`stdDeviation`, `feColorMatrix` 매트릭스 값)를 라이브로 조절할 수 있는 시각적 모션 실험실 (`motion-lab.tsx`, `live-controls.tsx`).

---

## 🕹️ 제공 아케이드 게임 목록 (Games Specification)

### Game 01. Maze Escape ([`app/components/play/maze/`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/maze/))
- **설명**: 랜덤 생성되는 미로 속에서 유기적 액체 플레이어를 조종하여 출구를 찾는 액체 퍼즐 아케이드 게임.
- **주요 파일**:
  - [`maze-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/maze/maze-game.tsx): 미로 UI 및 키보드(WASD/방향키)/터치 스와이프 인터랙션
  - [`maze-generator.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/maze/maze-generator.ts): DFS 기반 랜덤 미로 생성 알고리즘
  - [`use-liquid-player.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/maze/use-liquid-player.ts): 플레이어 이동 물리 훅

### Game 02. Blob.io Liquid ([`app/components/play/blob/`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/))
- **설명**: 유체 물리학 기반으로 먹이를 먹으며 적 세균을 흡수/피하는 거대화 리퀴드 아케이드 게임.
- **주요 파일**:
  - [`blob-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/blob-game.tsx): 캔버스 및 리더보드/HUD 오버레이
  - [`use-blob-engine.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/use-blob-engine.ts): 60FPS 캔버스 게임 루프
  - [`blob-physics.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/blob-physics.ts): 소프트바디 블롭 표면 출렁임(Wobble) 물리
  - [`blob-sound.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/blob-sound.ts): 흡수 및 합체 사운드 신디사이저

### Game 03. Liquid Tetris ([`app/components/play/tetris/`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/tetris/))
- **설명**: 테트리스 블록이 상단에서 떨어진 후 바닥에 안착 시 소프트바디 액체처럼 출렁이는 유체 블록 퍼즐.
- **주요 파일**:
  - [`tetris-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/tetris/tetris-game.tsx): 보드 및 조작 UI
  - [`use-tetris-engine.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/tetris/use-tetris-engine.ts): 블록 낙하, 라인 클리어 및 물리학
  - [`tetris-sound.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/tetris/tetris-sound.ts): 회전, 회전 착지, 줄 삭제 효과음

### Game 04. Blob Defense ([`app/components/play/defense/`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/))
- **설명**: 중앙 리퀴드 코어를 강화하고 다가오는 적들을 다중 조준 사격과 유기적 스킬로 저지하는 액체 타워 디펜스 게임.
- **주요 특징 & 파일**:
  - [`defense-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/defense-game.tsx): 
    - 난이도 선택 (`EASY`, `NORMAL`, `HARD`)
    - 모노스페이스 상태바 + 체력/방어막 실시간 프로그레스 바
    - 4단계 배속 (`0.5X` 슬로우모션 ~ `3.0X` 터보)
    - 상단 고정 탭 (`STATS`, `SKILLS`, `ELEMENT`, `MY STATS`) 및 독립 스크롤 영역
  - [`use-defense-engine.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/use-defense-engine.ts):
    - 동적 중앙 정렬 (`coreX = width / 2`)
    - 다중 주시 타겟팅 (Multi-Target Auto Firing: `stats.multiShot` 개수만큼 서로 다른 적 동시 사격)
    - 4가지 속성 융합: 테슬라(전기 방전), 맹독(산성 감속), 흡혈(체력 회복), 플라즈마(폭발)
    - 유기적 스킬: 구이 촉수, 산성 웅덩이, 폭발탄, 리퀴드 쉴드
    - 로컬 저장소 (`localStorage` key: `playground_v2_defense_save`) 자동 보존 및 리셋
  - [`defense-sound.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/defense-sound.ts):
    - 발사, 적중, 처치, 촉수, 클리어, 서브베이스 폭발음 Web Audio 신디사이저

---

## 🛠️ 전체 프로젝트 디렉토리 구조 (Directory Structure)

```
2026_PlayGround_v2/
├── app/
│   ├── components/
│   │   ├── filter-defs.tsx              # 전역 SVG Gooey 필터 정의 (#gooey)
│   │   ├── liquid-link.tsx              # 액체 페이지 이동 링크
│   │   ├── liquid-page-transition.tsx   # Framer Motion 페이지 전환 애니메이션
│   │   ├── route-back-button.tsx        # 뒤로가기 액션 버튼
│   │   ├── site-header.tsx              # 상단 메인 네비게이션 헤더
│   │   ├── home/                        # 랜딩 페이지 전용 컴포넌트
│   │   │   ├── hero.tsx
│   │   │   ├── home-page.tsx
│   │   │   └── playground-logo.tsx
│   │   ├── motion/                      # Motion Lab 파라미터 조절용 컴포넌트
│   │   │   ├── live-controls.tsx
│   │   │   ├── motion-controls-context.tsx
│   │   │   ├── motion-filter-defs.tsx
│   │   │   ├── motion-lab.tsx
│   │   │   └── motion-page.tsx
│   │   ├── navigation/                  # 사이트 네비게이션
│   │   ├── theme/                       # 다크/라이트 테마 컨텍스트
│   │   └── play/                        # 아케이드 게임 모듈
│   │       ├── game-selector.tsx        # 메인 게임 덱 카드 선택기
│   │       ├── play-page.tsx            # 메인 아케이드 뷰 라우터
│   │       ├── maze/                    # Game 01: Maze Escape
│   │       ├── blob/                    # Game 02: Blob.io Liquid
│   │       ├── tetris/                  # Game 03: Liquid Tetris
│   │       └── defense/                 # Game 04: Blob Defense
│   ├── motion/                          # /motion 라우트 페이지
│   ├── play/                            # /play 라우트 페이지 & play.css 디자인 토큰
│   ├── layout.tsx                       # 전역 애플리케이션 레이아웃
│   └── page.tsx                         # / (홈 페이지)
├── ideas/                               # 기획 및 기획아이디어 문서
│   └── blob_defense_idea.txt
├── README.md                            # 사람 개발자용 리드미 문서
└── README_AI.md                         # AI 어시스턴트 컨텍스트 문서
```

---

## ⚡ 실행 및 빌드 명령어

```bash
# 1. 개발 서버 실행
npm run dev

# 2. ESLint 코드 검사 (0 Errors, 0 Warnings 필수)
npm run lint

# 3. Next.js 최적화 빌드 검증
npm run build
```
