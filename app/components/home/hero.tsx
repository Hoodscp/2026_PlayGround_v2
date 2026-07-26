"use client";

import { PlaygroundLogo } from "./playground-logo";
import { ThemeControls } from "../theme/theme-controls";

export function Hero({ description }: { description: string }) {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <p className="eyebrow">A DIGITAL SPACE FOR CURIOUS MINDS</p>
      <PlaygroundLogo />

      <div className="hero-footer">
        <p className="hero-copy" aria-live="polite">
          {description}
        </p>
        <p className="menu-hint">
          <span>EXPLORE THE LAB</span>
          <span className="menu-hint__line" />
          <span>OPEN MENU</span>
        </p>
      </div>

      <ThemeControls />
      <div className="orb orb--one" aria-hidden="true" />
      <div className="orb orb--two" aria-hidden="true" />
    </section>
  );
}
