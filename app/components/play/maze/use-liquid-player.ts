"use client";

import { useEffect, useRef, useState } from "react";

export type LiquidParticle = {
  x: number;
  y: number;
  speed: number;
  angle: number;
};

export type LiquidCollision = {
  version: number;
  x: number;
  y: number;
};

export type LiquidPlayerFrame = {
  particles: LiquidParticle[];
  impact: number;
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
  collision: LiquidCollision,
) {
  const targetX = target.x;
  const targetY = target.y;
  const physics = useRef(particlesAt(target.x, target.y));
  const previousReset = useRef(resetVersion);
  const previousCollision = useRef(collision.version);
  const impact = useRef(0);
  const [playerFrame, setPlayerFrame] = useState<LiquidPlayerFrame>(() => ({
    particles: particlesAt(target.x, target.y),
    impact: 0,
  }));

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    if (previousReset.current !== resetVersion || reduceMotion.matches) {
      previousReset.current = resetVersion;
      previousCollision.current = collision.version;
      impact.current = 0;
      physics.current = particlesAt(targetX, targetY);
      frame = window.requestAnimationFrame(() =>
        setPlayerFrame({
          particles: physics.current.map(({ x, y, speed, angle }) => ({ x, y, speed, angle })),
          impact: 0,
        }),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    if (previousCollision.current !== collision.version) {
      previousCollision.current = collision.version;
      const hasImpact = collision.x !== 0 || collision.y !== 0;
      impact.current = hasImpact ? 1 : 0;

      if (hasImpact) {
        physics.current.forEach((particle, index) => {
          const strength = Math.max(1.8, 5.6 - index * 0.62);
          particle.vx += collision.x * strength;
          particle.vy += collision.y * strength;
          particle.angle = (Math.atan2(collision.y, collision.x) * 180) / Math.PI;
        });
      }
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

      impact.current *= 0.84;
      if (impact.current < 0.015) impact.current = 0;

      setPlayerFrame({
        particles: physics.current.map(({ x, y, speed, angle }) => ({ x, y, speed, angle })),
        impact: impact.current,
      });

      if (energy > 0.08 || impact.current > 0) {
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
  }, [collision.version, collision.x, collision.y, resetVersion, targetX, targetY]);

  return playerFrame;
}
