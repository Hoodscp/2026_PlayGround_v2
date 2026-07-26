"use client";

import { useCallback, useEffect, useRef } from "react";

import { useMotionControls } from "../motion-controls-context";
import { DemoCard } from "./demo-card";

const DOT_COUNT = 5;

export function MagneticCursorDemo() {
  const { values } = useMotionControls();
  const stageRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Array<HTMLElement | null>>([]);
  const target = useRef({ x: 0, y: 0 });
  const positions = useRef(
    Array.from({ length: DOT_COUNT }, () => ({ x: 0, y: 0 })),
  );
  const speedRef = useRef(values.speed);

  useEffect(() => {
    speedRef.current = values.speed;
  }, [values.speed]);

  const centerDots = useCallback(() => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    target.current = { x: rect.width / 2, y: rect.height / 2 };
    positions.current.forEach((point) => Object.assign(point, target.current));
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;

    function animate() {
      let lead = target.current;
      positions.current.forEach((point, index) => {
        const ease = 0.22 - index * 0.027;
        point.x += (lead.x - point.x) * ease * speedRef.current;
        point.y += (lead.y - point.y) * ease * speedRef.current;
        const dot = dotRefs.current[index];
        if (dot) {
          dot.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
        }
        lead = point;
      });
      if (visible && !reduceMotion.matches) frame = requestAnimationFrame(animate);
    }

    function updateAnimation() {
      if (visible && !reduceMotion.matches && !frame) frame = requestAnimationFrame(animate);
      if ((!visible || reduceMotion.matches) && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        updateAnimation();
      },
      { threshold: 0.05 },
    );

    centerDots();
    observer.observe(stage);
    reduceMotion.addEventListener("change", updateAnimation);
    window.addEventListener("resize", centerDots);
    return () => {
      observer.disconnect();
      reduceMotion.removeEventListener("change", updateAnimation);
      window.removeEventListener("resize", centerDots);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [centerDots]);

  return (
    <DemoCard
      number="01"
      title="Magnetic Cursor"
      description="움직여 보세요 — 방울들이 포인터의 궤적을 따라옵니다."
      action="POINTER"
      wide
    >
      <div
        ref={stageRef}
        className="demo-stage cursor-stage"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          target.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
        }}
        onPointerLeave={centerDots}
      >
        <div className="cursor-goo">
          {Array.from({ length: DOT_COUNT }, (_, index) => (
            <i
              ref={(element) => {
                dotRefs.current[index] = element;
              }}
              className={`cursor-dot cursor-dot--${index + 1}`}
              key={index}
            />
          ))}
        </div>
        <span className="stage-instruction">MOVE YOUR CURSOR</span>
      </div>
    </DemoCard>
  );
}
