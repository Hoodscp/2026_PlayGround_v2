import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { LiquidPageTransition } from "./components/liquid-page-transition";
import "../style.css";

export const metadata: Metadata = {
  title: "PlayGround v2 — Gooey Menu",
  description:
    "SVG Gooey filter와 feBlend를 활용한 PlayGround v2 인터랙티브 예제",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const paper = localStorage.getItem("playground-paper");
    const ink = localStorage.getItem("playground-ink");
    if (paper) document.documentElement.style.setProperty("--paper", paper);
    if (ink) {
      document.documentElement.style.setProperty("--ink", ink);
      const value = ink.replace("#", "");
      const red = parseInt(value.slice(0, 2), 16);
      const green = parseInt(value.slice(2, 4), 16);
      const blue = parseInt(value.slice(4, 6), 16);
      const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
      document.documentElement.style.setProperty(
        "--ink-contrast",
        brightness > 160 ? "#111111" : "#ffffff"
      );
    }
    if (sessionStorage.getItem("playground-liquid-transition")) {
      document.documentElement.classList.add("liquid-transition-arriving");
    }
  } catch {}
})();`,
          }}
        />
      </head>
      <body>
        {children}
        <LiquidPageTransition />
      </body>
    </html>
  );
}
