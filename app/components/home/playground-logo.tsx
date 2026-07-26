"use client";

import { useEffect, useRef } from "react";

export function PlaygroundLogo() {
  const logoRef = useRef<SVGSVGElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const noiseRef = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    const logo = logoRef.current;
    const displacement = displacementRef.current;
    const noise = noiseRef.current;
    if (!logo || !displacement || !noise) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scheduleTimer = 0;
    const burstTimers: number[] = [];

    function clearBurst() {
      burstTimers.forEach(window.clearTimeout);
      burstTimers.length = 0;
    }

    function schedule(delay = 1800) {
      window.clearTimeout(scheduleTimer);
      if (reduceMotion.matches) {
        displacement?.setAttribute("scale", "0");
        logo?.removeAttribute("data-glitching");
        return;
      }
      scheduleTimer = window.setTimeout(run, delay);
    }

    function run() {
      const burst = [0, 16, 5, 22, 3, 13, 0];
      noise?.setAttribute("seed", String(Math.floor(Math.random() * 97) + 3));
      logo?.setAttribute("data-glitching", "true");

      burst.forEach((scale, index) => {
        burstTimers.push(
          window.setTimeout(
            () => displacement?.setAttribute("scale", String(scale)),
            index * 46,
          ),
        );
      });

      burstTimers.push(
        window.setTimeout(() => {
          displacement?.setAttribute("scale", "0");
          logo?.removeAttribute("data-glitching");
          // 사용자가 의도적으로 선택한 잦은 글리치 간격을 유지한다.
          schedule(1200 + Math.random());
        }, burst.length * 46 + 40),
      );
    }

    const handleMotionPreference = () => schedule();
    reduceMotion.addEventListener("change", handleMotionPreference);
    schedule();

    return () => {
      window.clearTimeout(scheduleTimer);
      clearBurst();
      reduceMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return (
    <svg
      ref={logoRef}
      className="hero-logo"
      viewBox="0 0 1160 240"
      role="img"
      aria-labelledby="hero-title logo-desc"
    >
      <title id="hero-title">PlayGround v2</title>
      <desc id="logo-desc">
        feBlend 필터를 사용해 청록과 분홍 잉크가 겹쳐 보이는 로고
      </desc>
      <defs>
        <filter id="home-logo-blend" x="-12%" y="-35%" width="124%" height="170%">
          <feFlood floodColor="#79d7ff" result="cyan-color" />
          <feComposite in="cyan-color" in2="SourceAlpha" operator="in" result="cyan" />
          <feOffset in="cyan" dx="-3" dy="1" result="cyan-offset" />
          <feFlood floodColor="#ff7bc4" result="pink-color" />
          <feComposite in="pink-color" in2="SourceAlpha" operator="in" result="pink" />
          <feOffset in="pink" dx="3" dy="-1" result="pink-offset" />
          <feBlend in="cyan-offset" in2="pink-offset" mode="multiply" result="chromatic-ink" />
          <feBlend in="chromatic-ink" in2="SourceGraphic" mode="screen" result="blended-logo" />
          <feComposite in="blended-logo" in2="SourceAlpha" operator="in" result="clipped-logo" />
          <feTurbulence
            ref={noiseRef}
            type="fractalNoise"
            baseFrequency="0.012 0.18"
            numOctaves="1"
            seed="7"
            result="glitch-noise"
          />
          <feDisplacementMap
            ref={displacementRef}
            in="clipped-logo"
            in2="glitch-noise"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>
      <text x="16" y="172" className="hero-logo__play" filter="url(#home-logo-blend)">
        PlayGround
      </text>
      <text x="967" y="94" className="hero-logo__version">
        v2
      </text>
    </svg>
  );
}
