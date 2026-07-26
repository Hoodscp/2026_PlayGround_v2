"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const DEFAULT_PAPER = "#f7f7f2";
const DEFAULT_INK = "#111111";

type ThemeContextValue = {
  paper: string;
  ink: string;
  setPaper: (color: string) => void;
  setInk: (color: string) => void;
  reset: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function contrastFor(color: string) {
  const value = color.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 160 ? "#111111" : "#ffffff";
}

function applyTheme(paper: string, ink: string) {
  document.documentElement.style.setProperty("--paper", paper);
  document.documentElement.style.setProperty("--ink", ink);
  document.documentElement.style.setProperty("--ink-contrast", contrastFor(ink));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [paper, setPaperState] = useState(DEFAULT_PAPER);
  const [ink, setInkState] = useState(DEFAULT_INK);

  useEffect(() => {
    let frame = 0;
    try {
      const savedPaper = window.localStorage.getItem("playground-paper") ?? DEFAULT_PAPER;
      const savedInk = window.localStorage.getItem("playground-ink") ?? DEFAULT_INK;
      applyTheme(savedPaper, savedInk);
      frame = window.requestAnimationFrame(() => {
        setPaperState(savedPaper);
        setInkState(savedInk);
      });
    } catch {
      applyTheme(DEFAULT_PAPER, DEFAULT_INK);
    }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function updatePaper(color: string) {
    setPaperState(color);
    applyTheme(color, ink);
    try {
      window.localStorage.setItem("playground-paper", color);
    } catch {}
  }

  function updateInk(color: string) {
    setInkState(color);
    applyTheme(paper, color);
    try {
      window.localStorage.setItem("playground-ink", color);
    } catch {}
  }

  function reset() {
    setPaperState(DEFAULT_PAPER);
    setInkState(DEFAULT_INK);
    applyTheme(DEFAULT_PAPER, DEFAULT_INK);
    try {
      window.localStorage.setItem("playground-paper", DEFAULT_PAPER);
      window.localStorage.setItem("playground-ink", DEFAULT_INK);
    } catch {}
  }

  return (
    <ThemeContext.Provider
      value={{ paper, ink, setPaper: updatePaper, setInk: updateInk, reset }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
