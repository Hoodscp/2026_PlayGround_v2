"use client";

import { useMotionControls } from "./motion-controls-context";

export function MotionFilterDefs() {
  const { values } = useMotionControls();
  const cutoff = Math.round(values.density * -0.45);

  return (
    <svg className="filter-defs" aria-hidden="true">
      <defs>
        <filter id="gooey-demo" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={values.blur}
            result="demo-blur-result"
          />
          <feColorMatrix
            in="demo-blur-result"
            mode="matrix"
            values={`1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 ${values.density} ${cutoff}`}
            result="demo-goo"
          />
          <feComposite in="SourceGraphic" in2="demo-goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
