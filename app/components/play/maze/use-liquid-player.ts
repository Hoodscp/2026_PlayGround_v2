"use client";

import { useEffect, useRef, useState } from "react";

export type LiquidParticle = {
  x: number;
  y: number;
  speed: number;
  angle: number;
};

type PhysicsParticle = LiquidParticle & {
  vx: number;
  vy: number;
};

const PARTICLE_COUNT = 7;

function particlesAt(x: number, y: number): PhysicsParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x,
    y,
    vx: 0,
    vy: 0,
    speed: 0,
    angle: 0,
  }));
}

export function useLiquidPlayer(
  target: { x: number; y: number },
  resetVersion: number,
) {
  const targetX = target.x;
  const targetY = target.y;
  const physics = useRef(particlesAt(target.x, target.y));
  const previousReset = useRef(resetVersion);
  const [particles, setParticles] = useState<LiquidParticle[]>(() =>
    particlesAt(target.x, target.y),
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    if (previousReset.current !== resetVersion || reduceMotion.matches) {
      previousReset.current = resetVersion;
      physics.current = particlesAt(targetX, targetY);
      frame = window.requestAnimationFrame(() =>
        setParticles(physics.current.map(({ x, y, speed, angle }) => ({ x, y, speed, angle }))),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    function animate() {
      let lead = { x: targetX, y: targetY };
      let energy = 0;

      physics.current.forEach((particle, index) => {
        const dx = lead.x - particle.x;
        const dy = lead.y - particle.y;
        const stiffness = Math.max(0.105, 0.19 - index * 0.012);
        const damping = Math.min(0.78, 0.69 + index * 0.014);

        particle.vx = (particle.vx + dx * stiffness) * damping;
        particle.vy = (particle.vy + dy * stiffness) * damping;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.speed = Math.hypot(particle.vx, particle.vy);
        if (particle.speed > 0.02) {
          particle.angle = (Math.atan2(particle.vy, particle.vx) * 180) / Math.PI;
        }

        energy += Math.abs(dx) + Math.abs(dy) + particle.speed;
        lead = particle;
      });

      setParticles(
        physics.current.map(({ x, y, speed, angle }) => ({ x, y, speed, angle })),
      );

      if (energy > 0.08) {
        frame = window.requestAnimationFrame(animate);
      } else {
        physics.current.forEach((particle) => {
          particle.vx = 0;
          particle.vy = 0;
          particle.speed = 0;
        });
      }
    }

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [resetVersion, targetX, targetY]);

  return particles;
}
