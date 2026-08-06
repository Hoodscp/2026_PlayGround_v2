"use client";

import { useEffect, useRef, useState } from "react";

import {
  type BlendMode,
  useMotionControls,
} from "./motion-controls-context";

type NumericKey = "blur" | "density" | "size" | "distance" | "speed";

const numericControls: Array<{
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
}> = [
  { key: "blur", label: "Blur", min: 2, max: 18 },
  { key: "density", label: "Density", min: 12, max: 32 },
  {
    key: "size",
    label: "Blob size",
    min: 0.65,
    max: 1.5,
    step: 0.05,
    format: (value) => value.toFixed(2),
  },
  { key: "distance", label: "Distance", min: 60, max: 170 },
  {
    key: "speed",
    label: "Speed",
    min: 0.4,
    max: 2,
    step: 0.1,
    format: (value) => value.toFixed(1),
  },
];

export function LiveControls() {
  const { values, update, reset } = useMotionControls();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef(0);

  useEffect(() => {
    document.body.classList.toggle("controls-open", open);
    return () => document.body.classList.remove("controls-open");
  }, [open]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function cancelClose() {
    window.clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      if (
        !panelRef.current?.matches(":hover, :focus-within") &&
        !triggerRef.current?.matches(":hover")
      ) {
        setOpen(false);
      }
    }, 220);
  }

  return (
    <>
      <aside
        ref={panelRef}
        className="lab-controls"
        id="lab-controls-panel"
        aria-label="Gooey 필터 조작 패널"
        onPointerEnter={() => {
          if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
          cancelClose();
          setOpen(true);
        }}
        onPointerLeave={scheduleClose}
        onFocus={() => setOpen(true)}
        onBlur={scheduleClose}
      >
        <div className="lab-controls__head">
          <span>LIVE CONTROLS</span>
          <button type="button" onClick={reset}>
            RESET
          </button>
        </div>

        {numericControls.map(({ key, label, min, max, step, format }) => (
          <label key={key}>
            <span>
              {label} <output>{format?.(values[key]) ?? values[key]}</output>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={values[key]}
              onChange={(event) => update(key, Number(event.target.value))}
            />
          </label>
        ))}

        <div className="control-row" style={{ marginTop: "12px" }}>
          <label className="color-control">
            <span>Color</span>
            <input
              aria-label="Color"
              type="color"
              value={values.color}
              onChange={(event) => update("color", event.target.value)}
            />
          </label>
          <label className="blend-control">
            <span>Blend</span>
            <select
              value={values.blend}
              onChange={(event) => update("blend", event.target.value as BlendMode)}
            >
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="difference">Difference</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            const title = prompt("프리셋 이름을 입력하세요 (예: Neon Acid Fluid):", "My Liquid Motion");
            if (!title) return;

            fetch("/api/motion/presets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                stdDeviation: values.blur,
                matrixValues: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, values.density, -9],
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.dbConnected) {
                  alert(`✨ '${title}' 프리셋이 MongoDB에 성공적으로 저장되었습니다!`);
                } else {
                  alert(`⚠️ ${data.message || "로컬 브라우저에 임시 저장되었습니다."}`);
                }
              })
              .catch(() => alert("프리셋 저장 요청 실패"));
          }}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "8px",
            background: "var(--acid, #38bdf8)",
            color: "#060911",
            fontWeight: 800,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          💾 SAVE PRESET TO DB
        </button>
      </aside>

      <button
        ref={triggerRef}
        className="controls-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="lab-controls-panel"
        onPointerEnter={() => {
          if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            setOpen(true);
          }
        }}
        onPointerLeave={scheduleClose}
        onClick={() => setOpen((value) => !value)}
      >
        <span>LIVE CONTROLS</span>
        <span>{open ? "↑" : "↓"}</span>
      </button>
    </>
  );
}
