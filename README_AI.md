# 🤖 README_AI.md - Context & System Prompt Guide for AI Assistants

This document provides concise, high-density context for AI Coding Assistants (Antigravity, AGY CLI, Claude, ChatGPT, Cursor) working on **PlayGround v2**.

---

## 🎯 Architecture Overview & Core Principles

1. **Framework & Environment**:
   - Next.js 16 (Turbopack), React 19, TypeScript.
   - Strict adherence to zero ESLint warnings/errors (`npm run lint`) and successful static page generation (`npm run build`).

2. **Design System & Visual Consistency (CRITICAL)**:
   - **DO NOT** use generic utility frameworks like Tailwind unless requested. Use Vanilla CSS in [`app/play/play.css`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/play/play.css).
   - **Color Tokens**: `var(--paper)` (text/bright UI), `var(--ink)` (dark background `#060911`), `var(--acid)` (neon lime/cyan accent `#38bdf8` / `#22c55e`).
   - **UI Hierarchy Convention across ALL Games**:
     - Top Bar: `.play-kicker` (`GAME XX / TITLE`), `h2` title (`Manrope Variable`), right-aligned mode selector (`.defense-mode-selector`, `.tetris-mode-selector`).
     - Monospace Status Bar: Single horizontal bar (`.defense-game__status`, `.blob-game__status`, `.tetris-game__status`) with monospace metadata separated by slashes.
     - Glassmorphism Shell: Main wrapper (`.defense-board-shell`, `.tetris-board-shell`, `.blob-board-shell`) with `border: 1px solid color-mix(in srgb, var(--paper) 28%, transparent)` and `backdrop-filter: blur(20px)`.

3. **3-Layer Canvas Architecture for Liquid Physics & SVG Gooey Filters**:
   - Liquid physics games use 3 stacked HTML5 `<canvas>` elements inside a stage wrapper:
     - `bgCanvasRef` (z-index 1): Grid lines, dark radial background gradients (drawn WITHOUT filter to prevent grid distortion).
     - `blobsCanvasRef` (z-index 2): Liquid blobs, tentacles, projectiles (has CSS `filter: url("#defense-gooey-filter")` or `#gooey` applied for organic blob merging).
     - `labelsCanvasRef` (z-index 3, `pointer-events: none`): HP bars, floating damage numbers, HUD overlays (drawn clean without filter so text remains 100% crisp).

4. **React 19 Hooks & State Purity Rules**:
   - **NEVER access or mutate `ref.current` during render**.
   - Side effects (updating `ref.current` from state or running engine updates) MUST occur inside `useEffect` or event handlers.
   - For state lazy initialization, pass a factory function: `useState(() => loadSavedData())`.

---

## 🕹️ Blob Defense Architecture Map (`/app/components/play/defense/`)

- [`use-defense-engine.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/use-defense-engine.ts):
  - **Dynamic Centering**: Calculates `coreX = width / 2`, `coreY = height / 2` during canvas render to guarantee exact core centering on all screen sizes.
  - **Multi-Target Auto Firing**: `fireProjectiles(targetEnemies: Enemy[])` sorts enemies by proximity and targets `N` distinct closest enemies simultaneously (`stats.multiShot`).
  - **Fractional Tick Loop**: Uses `tickFractionRef` to support `0.5x` slow-motion physics alongside `1.0x`, `2.0x`, `3.0x` speeds.
  - **Persistence**: Key `playground_v2_defense_save` in `localStorage`. Automatically loads and saves `gold`, `highScore`, `maxWaveReached`, `upgrades`, `mutation`, `difficulty`.
  - **Game Over Explosion**: Triggers 80 radial liquid splat particles + shockwave floating text + Web Audio explosion sound when core HP hits 0.

- [`defense-game.tsx`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/defense-game.tsx):
  - Component view rendering top mode selector (`EASY`, `NORMAL`, `HARD`), status bar (`CORE HP`, `SHIELD`, `WAVE`, `GOLD`, `SCORE`, `MY STATS`, `SPEED`), health progress gauge bar, canvas stage, and right-side shop.
  - **Shop Layout**: `.defense-shop-panel` uses fixed tabs (`.defense-shop__tabs`) with `flex-shrink: 0` and independent scrollable content (`.defense-shop__content` with custom scrollbar).

- [`defense-sound.ts`](file:///home/ksj/workplace/web_dev/2026_PlayGround_v2/app/components/play/defense/defense-sound.ts):
  - Zero-dependency Web Audio API procedural synthesizer for shoot, hit, enemy death, tentacle whip, upgrade, wave clear, and game over sub-bass/white-noise explosion sounds.

---

## 📋 Mandatory Verification Protocol

Before declaring any task or feature complete, you MUST execute the following in terminal:

```bash
npm run lint    # Must return exit code 0 (0 errors, 0 warnings)
npm run build   # Must compile cleanly via Turbopack (0 build errors)
```
