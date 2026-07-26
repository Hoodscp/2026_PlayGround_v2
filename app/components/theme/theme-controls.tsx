"use client";

import { useTheme } from "./theme-provider";

export function ThemeControls() {
  const { paper, ink, setPaper, setInk, reset } = useTheme();

  return (
    <aside className="theme-controls" aria-label="메인 테마 색상">
      <div className="theme-controls__head">
        <span>THEME COLORS</span>
        <button type="button" onClick={reset}>
          RESET
        </button>
      </div>
      <label>
        <span>PAPER</span>
        <input
          aria-label="PAPER"
          type="color"
          value={paper}
          onChange={(event) => setPaper(event.target.value)}
        />
      </label>
      <label>
        <span>INK</span>
        <input
          aria-label="INK"
          type="color"
          value={ink}
          onChange={(event) => setInk(event.target.value)}
        />
      </label>
    </aside>
  );
}
