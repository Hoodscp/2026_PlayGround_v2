"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

const TRANSITION_STORAGE_KEY = "playground-liquid-transition";
const NAVIGATION_EVENT = "playground:liquid-navigate";

type LiquidPhase = "idle" | "covering" | "covered" | "revealing";

type LiquidNavigationDetail = {
  href: string;
  x?: number;
  y?: number;
};

type LiquidPosition = {
  x: number;
  y: number;
};

export function LiquidPageTransition() {
  const [phase, setPhase] = useState<LiquidPhase>("idle");
  const [position, setPosition] = useState<LiquidPosition>({ x: 0, y: 0 });
  const navigating = useRef(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function navigate({ href, x, y }: LiquidNavigationDetail) {
      if (navigating.current) return;
      if (reduceMotion.matches) {
        window.location.assign(href);
        return;
      }

      const nextPosition = {
        x: x ?? window.innerWidth / 2,
        y: y ?? window.innerHeight,
      };

      navigating.current = true;
      setPosition(nextPosition);
      setPhase("covering");

      try {
        window.sessionStorage.setItem(
          TRANSITION_STORAGE_KEY,
          JSON.stringify(nextPosition),
        );
      } catch {}

      window.setTimeout(() => window.location.assign(href), 800);
    }

    function handleNavigation(event: Event) {
      navigate((event as CustomEvent<LiquidNavigationDetail>).detail);
    }

    document.addEventListener(NAVIGATION_EVENT, handleNavigation);

    if (document.documentElement.classList.contains("liquid-transition-arriving")) {
      let storedPosition = { x: window.innerWidth / 2, y: window.innerHeight };

      try {
        const stored = window.sessionStorage.getItem(TRANSITION_STORAGE_KEY);
        if (stored) storedPosition = JSON.parse(stored) as LiquidPosition;
      } catch {}

      window.requestAnimationFrame(() => {
        setPosition(storedPosition);
        setPhase("covered");
        window.requestAnimationFrame(() => setPhase("revealing"));
      });

      window.setTimeout(() => {
        document.documentElement.classList.remove("liquid-transition-arriving");
        setPhase("idle");
        navigating.current = false;
        try {
          window.sessionStorage.removeItem(TRANSITION_STORAGE_KEY);
        } catch {}
      }, 900);
    }

    return () => {
      document.removeEventListener(NAVIGATION_EVENT, handleNavigation);
    };
  }, []);

  const style = {
    "--liquid-origin-x": `${position.x}px`,
    "--liquid-origin-y": `${position.y}px`,
  } as CSSProperties;

  return (
    <div
      className={`liquid-page-transition liquid-page-transition--${phase}`}
      style={style}
      aria-hidden="true"
    >
      <svg className="liquid-page-transition__defs">
        <defs>
          <filter id="liquid-page-goo" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="liquid-page-transition__blobs">
        <i className="liquid-page-transition__core" />
        {Array.from({ length: 7 }, (_, index) => (
          <i
            className={`liquid-page-transition__satellite liquid-page-transition__satellite--${index + 1}`}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

export function requestLiquidNavigation(
  href: string,
  event?: Pick<ReactMouseEvent, "clientX" | "clientY">,
) {
  document.dispatchEvent(
    new CustomEvent<LiquidNavigationDetail>(NAVIGATION_EVENT, {
      detail: {
        href,
        x: event?.clientX,
        y: event?.clientY,
      },
    }),
  );
}
