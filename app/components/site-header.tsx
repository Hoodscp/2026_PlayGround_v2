import { LiquidLink } from "./liquid-link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <LiquidLink className="mini-mark" href="/" aria-label="PlayGround v2 홈">
        PG<span>°</span>
      </LiquidLink>
      <div className="header-meta">
        <span>EXPERIMENT 02</span>
        <span>SVG FILTER LAB</span>
      </div>
    </header>
  );
}
