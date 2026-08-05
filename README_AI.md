# 🤖 README_AI.md - Complete Architecture & System Context for AI Agents

This document is specifically tailored for AI Coding Assistants (Antigravity, AGY, Claude, ChatGPT, Cursor) working on **PlayGround v2**. It maps the entire codebase structure, design conventions, state persistence rules, and verification requirements.

---

## 🎯 Architectural Principles & Design Guidelines

### 1. Technology Stack & Environment
- **Next.js 16 (Turbopack)**, **React 19**, **TypeScript**, **Web Audio API**.
- Zero ESLint errors or warnings policy (`npm run lint`).
- Clean static production build (`npm run build`).

### 2. UI Pattern Consistency Rules (STRICT MANDATE)
All arcade games in [`app/components/play/`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/) MUST strictly follow the same design tokens in [`app/play/play.css`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/play/play.css):
- **Header Top Bar**: `.play-kicker` (`GAME XX / TITLE`), `h2` title (`Manrope Variable`), right-aligned mode selector (`.defense-mode-selector`, `.tetris-mode-selector`, `.blob-mode-selector`).
- **Status Bar**: Monospace text metadata bar (`.defense-game__status`, `.blob-game__status`, `.tetris-game__status`) with `color-mix(in srgb, var(--ink) 88%, transparent)` and `backdrop-filter: blur(16px)`.
- **Board Shell Wrapper**: `.defense-board-shell`, `.tetris-board-shell`, `.blob-board-shell` with `border: 1px solid color-mix(in srgb, var(--paper) 28%, transparent)` and `backdrop-filter: blur(20px)`.
- **CSS Color Tokens**: `var(--paper)` (primary white/light text), `var(--ink)` (deep navy/dark background `#060911`), `var(--acid)` (neon accent `#38bdf8` / `#22c55e`).

### 3. Layered HTML5 Canvas Pattern for Liquid Physics
Games requiring SVG Gooey filter liquid effect MUST use a 3-layer `<canvas>` approach:
1. `bgCanvasRef` (Layer 1, Bottom): Background gradient, ambient rings, grid lines. **DO NOT** apply SVG gooey filter to this layer.
2. `blobsCanvasRef` (Layer 2, Middle): Blobs, fluid particles, projectiles, tentacles. Apply CSS `filter: url("#defense-gooey-filter")` or `#gooey`.
3. `labelsCanvasRef` (Layer 3, Top, `pointer-events: none`): HP bars, damage floating numbers, text. Rendered WITHOUT SVG filter to guarantee 100% crisp text readability.

### 4. React 19 Hook Purity Standards
- **NEVER mutate or access `.current` of `useRef` inside render bodies**.
- Synchronize refs inside `useEffect` or within event callbacks (e.g. `onClick`, `onKeyDown`, requestAnimationFrame loop).
- Lazy initialize `useState` via factory callbacks: `useState(() => loadSavedData())`.

---

## 🗺️ Complete Directory & Module Map

### 1. Core Platform Components (`app/components/`)
- [`filter-defs.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/filter-defs.tsx): Global SVG Gooey filter `#gooey` definitions.
- [`liquid-link.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/liquid-link.tsx): Smooth liquid transition link wrapper.
- [`liquid-page-transition.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/liquid-page-transition.tsx): Framer Motion container for route page transitions.
- `home/`: Landing page logo, hero section, and homepage controller (`playground-logo.tsx`, `hero.tsx`, `home-page.tsx`).
- `motion/`: Interactive SVG filter tuning laboratory components (`motion-lab.tsx`, `live-controls.tsx`, `motion-controls-context.tsx`).
- `play/`: Arcade games router (`play-page.tsx`) and game card deck selector (`game-selector.tsx`).

### 2. Arcade Games Module Map (`app/components/play/`)

#### Game 01: Maze Escape (`maze/`)
- [`maze-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/maze/maze-game.tsx): UI & input handlers.
- [`maze-generator.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/maze/maze-generator.ts): DFS maze grid generator.
- [`use-liquid-player.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/maze/use-liquid-player.ts): Liquid player movement hook.

#### Game 02: Blob.io Liquid (`blob/`)
- [`blob-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/blob-game.tsx): Canvas view & leaderboard HUD.
- [`use-blob-engine.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/use-blob-engine.ts): Agario-style 60FPS engine loop.
- [`blob-physics.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/blob-physics.ts): Wobble physics calculation.
- [`blob-sound.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/blob/blob-sound.ts): Audio synthesizer.

#### Game 03: Liquid Tetris (`tetris/`)
- [`tetris-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/tetris/tetris-game.tsx): Tetris stage & touch controls.
- [`use-tetris-engine.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/tetris/use-tetris-engine.ts): Physics soft-body matrix & line clear logic.
- [`tetris-sound.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/tetris/tetris-sound.ts): Web Audio sound effects.

#### Game 04: Blob Defense (`defense/`)
- [`defense-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/defense-game.tsx): UI Stage, difficulty selector (`EASY`/`NORMAL`/`HARD`), speed controls (`0.5X`~`3.0X`), progress gauge bars, shop tabs (`STATS`, `SKILLS`, `ELEMENT`, `MY STATS`) with fixed tabs and independent scroll content.
- [`use-defense-engine.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/use-defense-engine.ts): Dynamic core centering (`width / 2`), Multi-Target Auto Firing (`stats.multiShot`), fractional tick loop for `0.5x` slow-mo, localStorage persistence (`playground_v2_defense_save`), core explosion particle burst on game over.
- [`defense-sound.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/defense-sound.ts): Web Audio synthesizer for shoots, hits, tentacle whips, wave clears, and sub-bass white noise game over explosion.

---

## ⚡ Extension Guide for Future AI Agents

When adding a new game (e.g. Game 05) or modifying existing games:
1. Register the new game ID in [`game-selector.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/game-selector.tsx).
2. Mount the component in [`play-page.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/play-page.tsx).
3. Use existing design tokens in [`app/play/play.css`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/play/play.css) for top bar, status bar, and board shell.
4. Run `npm run lint` and `npm run build` after making code changes.
