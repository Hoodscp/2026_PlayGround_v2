"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { DemoCard } from "./demo-card";

export function GooeyButtonDemo() {
  const [popped, setPopped] = useState(false);

  function splash() {
    setPopped(false);
    window.requestAnimationFrame(() => {
      setPopped(true);
      window.setTimeout(() => setPopped(false), 720);
    });
  }

  return (
    <DemoCard number="03" title="Gooey Button" description="클릭할 때 액체 방울이 튀어 오릅니다." action="CLICK">
      <div className="demo-stage button-stage">
        <div className={`burst-wrap${popped ? " is-popped" : ""}`}>
          {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
          <button className="burst-button" type="button" onClick={splash}>
            MAKE A SPLASH
          </button>
        </div>
      </div>
    </DemoCard>
  );
}

export function BlobNavigationDemo() {
  const [active, setActive] = useState(0);
  const labels = ["DISCOVER", "COLLECT", "CREATE"];

  return (
    <DemoCard number="04" title="Blob Navigation" description="활성 상태가 메뉴 사이를 액체처럼 이동합니다." action="SELECT" wide>
      <div className="demo-stage blob-nav-stage">
        <div
          className="blob-tabs"
          style={{ "--active-index": active } as CSSProperties}
        >
          <span className="blob-tabs__active" />
          {labels.map((label, index) => (
            <button
              className={active === index ? "is-selected" : ""}
              key={label}
              type="button"
              onClick={() => setActive(index)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </DemoCard>
  );
}

export function BubbleToggleDemo() {
  const [enabled, setEnabled] = useState(false);

  return (
    <DemoCard number="08" title="Bubble Toggle" description="두 상태 사이를 붙었다 떨어지며 전환합니다." action="TOGGLE">
      <div className="demo-stage toggle-stage">
        <button
          className={`bubble-toggle${enabled ? " is-on" : ""}`}
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((value) => !value)}
        >
          <i />
          <span>OFF</span>
          <span>ON</span>
        </button>
      </div>
    </DemoCard>
  );
}

export function FluidProgressDemo() {
  const [step, setStep] = useState(1);
  const width = ((step - 1) / 3) * 86;

  return (
    <DemoCard number="09" title="Fluid Progress" description="클릭할 때마다 다음 단계로 이어집니다." action="CLICK">
      <div className="demo-stage progress-stage">
        <button
          className="fluid-progress"
          type="button"
          aria-label="진행 단계 변경"
          data-step={step}
          style={{ "--progress-width": `${width}%` } as CSSProperties}
          onClick={() => setStep((value) => (value % 4) + 1)}
        >
          <span className="progress-fill" />
          <i /><i /><i /><i />
        </button>
        <span className="progress-label">
          STEP <b>{step}</b> / 4
        </span>
      </div>
    </DemoCard>
  );
}
