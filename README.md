# 🎮 PlayGround v2

**PlayGround v2**는 웹 기술(Next.js, React 19, HTML5 Canvas, Web Audio API)을 기반으로 한 유기적 액체(Liquid) 컨셉 아케이드 미니게임 플랫폼입니다.

---

## 🚀 빠른 시작 (Quick Start)

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000/play` 접속

### 코드 검증 및 생산 빌드
```bash
npm run lint    # ESLint 검사 (0 Errors, 0 Warnings 준수)
npm run build   # Next.js Turbopack 최적화 빌드
```

---

## 🕹️ 제공 게임 목록 (Available Games)

### Game 01. Maze Escape (`/app/components/play/maze`)
- 유기적 액체 플레이어를 조종하여 랜덤 생성되는 미로의 액체 출구를 찾는 퍼즐 아케이드 게임.
- 방향키/WASD 및 모바일 터치 스와이프 조작 지원.

### Game 02. Blob.io Liquid (`/app/components/play/blob`)
- 유체 물리 엔진 기반 먹이고 성숙하는 액체 세포 키우기 아케이드 게임.
- 다른 세포를 흡수하며 거대해지는 리퀴드 물리 메커니즘.

### Game 03. Liquid Tetris (`/app/components/play/tetris`)
- 정통 테트리스 블록에 소프트바디 액체 출렁임 물리를 적용한 신개념 블록 퍼즐 게임.

### Game 04. Blob Defense (`/app/components/play/defense`)
- 중앙의 리퀴드 코어를 지키는 유기적 타워 디펜스 게임.
- **핵심 특징**:
  - 🎨 **SVG Gooey Filter**: 캔버스 3레이어 렌더링으로 유체 결합 착시 연출 + 100% 선명한 라벨 레이어.
  - 🔱 **다중 주시 타겟팅 (Multi-Target)**: 한 번에 여러 적들을 동시에 각각 자동 조준하여 사격.
  - 🧬 **4가지 융합 속성 (Mutation)**: 테슬라(전기 방전), 맹독(산성 감속), 흡혈(체력 회복), 플라즈마(치명타 폭발).
  - 🐙 **유기적 스킬**: 구이 촉수, 산성 웅덩이 아우라, 폭발성 액체탄, 리퀴드 쉴드 방어막.
  - 🎯 **난이도 3단계**: `EASY` (쉬움), `NORMAL` (보통), `HARD` (어려움).
  - ⏱️ **4단계 배속 지원**: `0.5X` (슬로우 모션), `1.0X`, `2.0X`, `3.0X`.
  - 💥 **게임오버 파괴 이펙트**: 코어 파괴 시 80여 개의 액체 파편 폭발 애니메이션 및 폭발 효과음.
  - 💾 **로컬 저장소 자동 보존**: 골드, 스탯 업그레이드, 융합 속성, 최고 기록 브라우저 `localStorage` 자동 보존 및 리셋 지원.

---

## 🛠️ 기술 스택 & UI 디자인 시스템

- **Framework**: Next.js 16 (Turbopack), React 19
- **Styling**: Vanilla CSS, Design Tokens (`var(--paper)`, `var(--ink)`, `var(--acid)`), Glassmorphism Panel (`backdrop-filter: blur(16px)`), CSS `color-mix()`
- **Rendering**: HTML5 Layered Canvas 2D, SVG Filters (`feGaussianBlur`, `feColorMatrix`)
- **Sound**: Web Audio API 순수 프로시저럴 웹 사운드 신디사이저 (`defense-sound.ts`)

---

## 📂 프로젝트 구조 (Project Directory)

```
2026_PlayGround_v2/
├── app/
│   ├── components/play/
│   │   ├── maze/           # Game 01: Maze Escape
│   │   ├── blob/           # Game 02: Blob.io Liquid
│   │   ├── tetris/         # Game 03: Liquid Tetris
│   │   ├── defense/        # Game 04: Blob Defense
│   │   │   ├── defense-game.tsx        # UI 스테이지 & 상점 컴포넌트
│   │   │   ├── use-defense-engine.ts   # 60FPS 물리학 & 웨이브 엔진 훅
│   │   │   └── defense-sound.ts        # Web Audio 오디오 신디사이저
│   │   ├── game-selector.tsx # 게임 선택 메인 카드 덱
│   │   └── play-page.tsx     # 메인 아케이드 뷰 라우터
│   ├── play/
│   │   ├── page.tsx        # /play 페이지 엔트리포인트
│   │   └── play.css        # 전체 아케이드 통합 공통 디자인 시스템 CSS
```
