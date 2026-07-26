import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";

import { FilterDefs } from "./components/filter-defs";
import { LiquidPageTransition } from "./components/liquid-page-transition";
import { SiteHeader } from "./components/site-header";
import { ThemeBootstrap } from "./components/theme/theme-bootstrap";
import { ThemeProvider } from "./components/theme/theme-provider";
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
        <ThemeBootstrap />
      </head>
      <body>
        <ThemeProvider>
          <FilterDefs />
          <SiteHeader />
          {children}
          <LiquidPageTransition />
        </ThemeProvider>
      </body>
    </html>
  );
}
