"use client";

import type { PointerEvent } from "react";
import { useMemo, useRef, useState } from "react";

import { useMotionControls } from "../motion-controls-context";
import { DemoCard } from "./demo-card";

const anchor = { x: 245, y: 140 };
const initialPoint = { x: 480, y: 140 };

function bridgePath(point: { x: number; y: number }, maxDistance: number) {
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const distance = Math.hypot(dx, dy);
  if (distance > maxDistance || distance < 1) return "";

  const perpendicular = Math.atan2(dy, dx) + Math.PI / 2;
  const tension = Math.max(12, 42 * (1 - distance / maxDistance));
  const offsetX = Math.cos(perpendicular) * tension;
  const offsetY = Math.sin(perpendicular) * tension;
  const middleX = (anchor.x + point.x) / 2;
  const middleY = (anchor.y + point.y) / 2;

  return `M ${anchor.x + offsetX} ${anchor.y + offsetY}
    Q ${middleX} ${middleY} ${point.x + offsetX} ${point.y + offsetY}
    L ${point.x - offsetX} ${point.y - offsetY}
    Q ${middleX} ${middleY} ${anchor.x - offsetX} ${anchor.y - offsetY} Z`;
}

export function ElasticDemo() {
  const { values } = useMotionControls();
  const svgRef = useRef<SVGSVGElement>(null);
  const [point, setPoint] = useState(initialPoint);
  const [dragging, setDragging] = useState(false);
  const path = useMemo(
    () => bridgePath(point, values.distance * 2.8),
    [point, values.distance],
  );

  function move(event: PointerEvent<SVGCircleElement>) {
    if (!dragging || !svgRef.current) return;
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const transformed = svgPoint.matrixTransform(
      svgRef.current.getScreenCTM()?.inverse(),
    );
    setPoint({
      x: Math.max(80, Math.min(720, transformed.x)),
      y: Math.max(65, Math.min(215, transformed.y)),
    });
  }

  return (
    <DemoCard number="07" title="Elastic Connection" description="오른쪽 원을 드래그해 액체 연결부를 늘여 보세요." action="DRAG" wide>
      <div className="demo-stage elastic-stage" onPointerLeave={() => setDragging(false)}>
        <svg ref={svgRef} viewBox="0 0 800 280" aria-label="드래그 가능한 두 원">
          <path d={path} />
          <circle cx={anchor.x} cy={anchor.y} r="52" />
          <circle
            className="elastic-handle"
            cx={point.x}
            cy={point.y}
            r="52"
            onPointerDown={(event) => {
              setDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={move}
            onPointerUp={() => setDragging(false)}
          />
        </svg>
        <span className="stage-instruction">DRAG THE RIGHT BLOB</span>
      </div>
    </DemoCard>
  );
}
