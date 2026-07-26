"use client";

import type { CSSProperties } from "react";

import { useMotionControls } from "../motion-controls-context";
import { DemoCard } from "./demo-card";

export function LiquidLoaderDemo() {
  return (
    <DemoCard number="02" title="Liquid Loader" description="회전하며 합쳐지는 로딩 인디케이터." action="AUTO">
      <div className="demo-stage loader-stage">
        <div className="liquid-loader">
          {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
        </div>
        <span className="loader-percent">72%</span>
      </div>
    </DemoCard>
  );
}

export function ParticleMergeDemo() {
  return (
    <DemoCard number="05" title="Particle Merge" description="흩어진 입자가 하나의 덩어리로 모입니다." action="HOVER">
      <div className="demo-stage particle-stage">
        <div className="particle-field">
          {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
        </div>
        <span className="stage-instruction">HOLD TO MERGE</span>
      </div>
    </DemoCard>
  );
}

export function LiquidTextDemo() {
  return (
    <DemoCard number="06" title="Liquid Text Reveal" description="방울이 지나간 자리에 단어가 드러납니다." action="AUTO">
      <div className="demo-stage text-stage">
        <strong>GOOEY</strong>
        <div className="text-bubbles">
          {Array.from({ length: 4 }, (_, index) => <i key={index} />)}
        </div>
      </div>
    </DemoCard>
  );
}

export function ColorMixingDemo() {
  const { values } = useMotionControls();
  return (
    <DemoCard number="10" title="Color Mixing Blobs" description="겹치는 색과 Blend 모드의 관계를 관찰하세요." action="BLEND" wide>
      <div className="demo-stage color-stage">
        <div className="color-blobs" style={{ "--blend-mode": values.blend } as CSSProperties}>
          <i className="color-blob color-blob--cyan" />
          <i className="color-blob color-blob--pink" />
          <i className="color-blob color-blob--acid" />
        </div>
        <span className="blend-readout">{values.blend.toUpperCase()}</span>
      </div>
    </DemoCard>
  );
}

export function ImageMetaballsDemo() {
  return (
    <DemoCard number="11" title="Image Metaballs" description="이미지 성격의 원형 썸네일이 서로 연결됩니다." action="HOVER">
      <div className="demo-stage image-stage">
        <div className="image-metaballs">
          {Array.from({ length: 4 }, (_, index) => <i key={index} />)}
        </div>
      </div>
    </DemoCard>
  );
}
