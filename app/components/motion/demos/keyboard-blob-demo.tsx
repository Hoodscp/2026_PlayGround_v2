"use client";

import type { KeyboardEvent } from "react";
import { useState } from "react";

import { DemoCard } from "./demo-card";

const initialPosition = { x: 50, y: 50 };

export function KeyboardBlobDemo() {
  const [position, setPosition] = useState(initialPosition);

  function move(event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 8 : 4;
    const delta = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }[event.key];

    if (event.key === "Home") {
      event.preventDefault();
      setPosition(initialPosition);
      return;
    }
    if (!delta) return;

    event.preventDefault();
    setPosition((current) => ({
      x: Math.max(10, Math.min(90, current.x + delta.x)),
      y: Math.max(15, Math.min(85, current.y + delta.y)),
    }));
  }

  return (
    <DemoCard
      number="13"
      title="Keyboard Blob"
      description="포커스한 방울을 방향키로 움직이고 Home 키로 중앙에 되돌립니다."
      action="KEYBOARD"
      wide
    >
      <div className="demo-stage keyboard-stage">
        <p id="keyboard-blob-help" className="keyboard-stage__help">
          TAB TO FOCUS · ARROW KEYS TO MOVE · SHIFT FOR LARGE STEP · HOME TO RESET
        </p>
        <div className="keyboard-goo" aria-hidden="true">
          <i
            className="keyboard-blob-shadow"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          />
          <i className="keyboard-blob-anchor" />
        </div>
        <button
          className="keyboard-blob"
          type="button"
          aria-describedby="keyboard-blob-help keyboard-blob-status"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
          onKeyDown={move}
        >
          <span className="sr-only">키보드로 움직이는 방울</span>
        </button>
        <output id="keyboard-blob-status" className="keyboard-stage__status" aria-live="polite">
          X {position.x} · Y {position.y}
        </output>
      </div>
    </DemoCard>
  );
}
