"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type BlendMode = "multiply" | "screen" | "overlay" | "difference";

export type MotionControls = {
  blur: number;
  density: number;
  size: number;
  distance: number;
  speed: number;
  color: string;
  blend: BlendMode;
};

const defaults: MotionControls = {
  blur: 8,
  density: 20,
  size: 1,
  distance: 110,
  speed: 1,
  color: "#ffffff",
  blend: "multiply",
};

type MotionControlsContextValue = {
  values: MotionControls;
  update: <K extends keyof MotionControls>(key: K, value: MotionControls[K]) => void;
  reset: () => void;
};

const MotionControlsContext = createContext<MotionControlsContextValue | null>(null);

export function MotionControlsProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState(defaults);

  const context = useMemo<MotionControlsContextValue>(
    () => ({
      values,
      update: (key, value) =>
        setValues((current) => ({ ...current, [key]: value })),
      reset: () => setValues(defaults),
    }),
    [values],
  );

  return (
    <MotionControlsContext.Provider value={context}>
      {children}
    </MotionControlsContext.Provider>
  );
}

export function useMotionControls() {
  const context = useContext(MotionControlsContext);
  if (!context) {
    throw new Error("useMotionControls must be used inside MotionControlsProvider.");
  }
  return context;
}
