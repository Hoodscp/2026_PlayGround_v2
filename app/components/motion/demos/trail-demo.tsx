"use client";

import { useRef } from "react";

import { useMotionControls } from "../motion-controls-context";
import { DemoCard } from "./demo-card";

export function TrailDemo() {
  const { values } = useMotionControls();
  const layerRef = useRef<HTMLDivElement>(null);
  const lastTrailTime = useRef(0);

  return (
    <DemoCard number="12" title="Gooey Trail" description="직접 그린 움직임이 액체 꼬리로 남습니다." action="DRAW">
      <div
        className="demo-stage trail-stage"
        onPointerMove={(event) => {
          const now = performance.now();
          if (now - lastTrailTime.current < 22 / values.speed) return;
          lastTrailTime.current = now;

          const rect = event.currentTarget.getBoundingClientRect();
          const dot = document.createElement("i");
          dot.className = "trail-dot";
          dot.style.left = `${event.clientX - rect.left}px`;
          dot.style.top = `${event.clientY - rect.top}px`;
          layerRef.current?.append(dot);
          dot.addEventListener("animationend", () => dot.remove(), { once: true });
        }}
      >
        <div ref={layerRef} className="trail-layer" />
        <span className="stage-instruction">DRAW INSIDE</span>
      </div>
    </DemoCard>
  );
}
