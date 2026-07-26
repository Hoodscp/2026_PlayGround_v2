"use client";

import type { CSSProperties } from "react";

import { GooeyNavigation } from "../navigation/gooey-navigation";
import { SectionIndicator } from "../navigation/section-indicator";
import {
  ColorMixingDemo,
  ImageMetaballsDemo,
  LiquidLoaderDemo,
  LiquidTextDemo,
  ParticleMergeDemo,
} from "./demos/automatic-demos";
import {
  BlobNavigationDemo,
  BubbleToggleDemo,
  FluidProgressDemo,
  GooeyButtonDemo,
} from "./demos/button-demos";
import { ElasticDemo } from "./demos/elastic-demo";
import { KeyboardBlobDemo } from "./demos/keyboard-blob-demo";
import { MagneticCursorDemo } from "./demos/magnetic-cursor-demo";
import { TrailDemo } from "./demos/trail-demo";
import { LiveControls } from "./live-controls";
import { MotionControlsProvider, useMotionControls } from "./motion-controls-context";
import { MotionFilterDefs } from "./motion-filter-defs";

function MotionLabContent() {
  const { values } = useMotionControls();
  const style = {
    "--demo-size": values.size,
    "--demo-distance": `${values.distance}px`,
    "--demo-speed": values.speed,
    "--demo-color": values.color,
  } as CSSProperties;

  return (
    <>
      <MotionFilterDefs />
      <main>
        <section
          className="motion-lab"
          aria-labelledby="motion-title"
          style={style}
        >
          <div className="motion-lab__intro">
            <p className="section-kicker">03 / MOTION</p>
            <h2 id="motion-title">
              Soft bodies,
              <br />
              sharp ideas.
            </h2>
            <p>
              하나의 필터, 열세 가지 움직임. 포인터와 키보드로 움직이고,
              드래그하고, 버튼을 눌러 각각의 Gooey 반응을 직접 확인해 보세요.
            </p>
          </div>

          <LiveControls />

          <div className="demo-grid">
            <MagneticCursorDemo />
            <LiquidLoaderDemo />
            <GooeyButtonDemo />
            <BlobNavigationDemo />
            <ParticleMergeDemo />
            <LiquidTextDemo />
            <ElasticDemo />
            <BubbleToggleDemo />
            <FluidProgressDemo />
            <ColorMixingDemo />
            <ImageMetaballsDemo />
            <TrailDemo />
            <KeyboardBlobDemo />
          </div>

          <footer className="motion-footer">
            <span>PLAYGROUND v2 / SVG FILTER LAB</span>
          </footer>
        </section>
      </main>
      <GooeyNavigation current="Motion" motionPage />
      <SectionIndicator number="03" name="MOTION" />
    </>
  );
}

export function MotionLab() {
  return (
    <MotionControlsProvider>
      <MotionLabContent />
    </MotionControlsProvider>
  );
}
